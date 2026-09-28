// makemytour/lib/notificationService.ts

export interface InAppNotification {
  id: string;
  flightNumber: string;
  airline: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  timestamp: string;
  read: boolean;
  status?: string;
  delayMinutes?: number;
  delayReason?: string;
  estimatedArrival?: string;
}

type NotificationListener = (notifications: InAppNotification[]) => void;
type ToastListener = (toast: InAppNotification) => void;

// Snapshot of flight state used for delta detection
interface FlightSnapshot {
  status: string;
  estimatedArrivalTime: string;
  estimatedDepartureTime: string;
  gate: string;
  delayMinutes: number;
}

class NotificationService {
  private notifications: InAppNotification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private toastListeners: Set<ToastListener> = new Set();
  private soundEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;
  private STORAGE_KEY = "mmt_flight_notifications";

  /** Previous known state of each flight for delta detection */
  private previousSnapshots: Map<string, FlightSnapshot> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          this.notifications = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load notifications from storage", e);
      }
    }
  }

  public isPushSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  public getPushPermission(): NotificationPermission {
    if (!this.isPushSupported()) return "denied";
    return Notification.permission;
  }

  public async requestPushPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) return "denied";
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.error("Error requesting push notification permission", e);
      return "denied";
    }
  }

  public toggleSound(enabled?: boolean): boolean {
    this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
    return this.soundEnabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Generates a pleasant 2-tone airport chime (Ding-Dong) using the Web Audio API
   */
  public playAirportChime(severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL" = "INFO") {
    if (!this.soundEnabled || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === "suspended") {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;

      // Tone frequencies vary by severity
      const freqMap: Record<string, [number, number]> = {
        INFO:     [587.33, 440.00],  // D5 → A4 (calm blue)
        SUCCESS:  [659.25, 523.25],  // E5 → C5 (bright green)
        WARNING:  [523.25, 392.00],  // C5 → G4 (amber alert)
        CRITICAL: [440.00, 329.63],  // A4 → E4 (deep red)
      };
      const [freq1, freq2] = freqMap[severity] ?? freqMap["INFO"];

      const play = (freq: number, startAt: number, duration: number) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startAt);
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(startAt);
        osc.stop(startAt + duration + 0.05);
      };

      play(freq1, now, 0.45);
      play(freq2, now + 0.18, 0.7);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Triggers a live notification:
   * 1. Browser Native Push Notification (if permission granted)
   * 2. In-App Notification Center item with persistence
   * 3. Airport acoustic chime sound (severity-coded)
   * 4. Toast overlay event for all toast listeners
   */
  public notifyFlightUpdate(payload: {
    flightNumber: string;
    airline: string;
    title: string;
    message: string;
    severity?: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
    status?: string;
    delayMinutes?: number;
    delayReason?: string;
    estimatedArrival?: string;
  }) {
    const severity = payload.severity ??
      (payload.delayMinutes && payload.delayMinutes > 0 ? "WARNING" : "INFO");

    const item: InAppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      flightNumber: payload.flightNumber,
      airline: payload.airline,
      title: payload.title,
      message: payload.message,
      severity,
      timestamp: new Date().toISOString(),
      read: false,
      status: payload.status,
      delayMinutes: payload.delayMinutes,
      delayReason: payload.delayReason,
      estimatedArrival: payload.estimatedArrival,
    };

    // Prepend to in-app history (limit to 50 items)
    this.notifications = [item, ...this.notifications.slice(0, 49)];
    this.saveToStorage();
    this.emit();

    // Toast overlay
    this.emitToast(item);

    // Play severity-coded chime
    this.playAirportChime(severity);

    // Native Browser Push Notification
    if (this.isPushSupported() && Notification.permission === "granted") {
      try {
        const nativeNotification = new Notification(payload.title, {
          body: payload.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `flight-${payload.flightNumber}`,
        });

        nativeNotification.onclick = () => {
          window.focus();
          if (typeof window !== "undefined") {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = `/tracker?flight=${payload.flightNumber}`;
          }
        };
      } catch (e) {
        console.error("Native notification display failed", e);
      }
    }

    return item;
  }

  /**
   * Compares a fresh batch of flight statuses against the last known snapshot
   * and automatically fires notifications for:
   *  - Status changes (e.g. ON_TIME → DELAYED)
   *  - ETA shifts ≥10 minutes
   *  - Gate changes
   *  - New cancellations
   *  - Delay escalations
   */
  public detectAndNotifyChanges(
    currentStatuses: Array<{
      flightNumber: string;
      airline: string;
      status: string;
      statusDisplay: string;
      statusColor: string;
      estimatedArrivalTime: string;
      estimatedDepartureTime: string;
      gate: string;
      delayMinutes: number;
      delayReason?: string;
      contextNote?: string;
    }>
  ): void {
    for (const flight of currentStatuses) {
      const prev = this.previousSnapshots.get(flight.flightNumber);

      if (!prev) {
        // First time seeing this flight — just record snapshot, no notification
        this.previousSnapshots.set(flight.flightNumber, {
          status: flight.status,
          estimatedArrivalTime: flight.estimatedArrivalTime,
          estimatedDepartureTime: flight.estimatedDepartureTime,
          gate: flight.gate,
          delayMinutes: flight.delayMinutes,
        });
        continue;
      }

      const changes: string[] = [];
      let severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL" = "INFO";

      // 1. Status change
      if (prev.status !== flight.status) {
        const isWorsening = flight.delayMinutes > (prev.delayMinutes ?? 0) ||
          flight.status === "CANCELLED";
        severity = flight.status === "CANCELLED" ? "CRITICAL"
          : isWorsening ? "WARNING"
          : flight.status === "BOARDING" || flight.status === "ON_TIME" ? "SUCCESS"
          : "INFO";
        changes.push(`Status changed: ${prev.status.replace(/_/g, " ")} → ${flight.statusDisplay}`);
      }

      // 2. ETA shift ≥10 minutes
      const prevEtaMs = prev.estimatedArrivalTime ? new Date(prev.estimatedArrivalTime).getTime() : 0;
      const curEtaMs = flight.estimatedArrivalTime ? new Date(flight.estimatedArrivalTime).getTime() : 0;
      if (prevEtaMs > 0 && curEtaMs > 0) {
        const driftMin = Math.round((curEtaMs - prevEtaMs) / 60000);
        if (Math.abs(driftMin) >= 10) {
          const dir = driftMin > 0 ? `+${driftMin}m later` : `${driftMin}m earlier`;
          changes.push(`ETA revised by ${dir}`);
          if (driftMin > 0 && severity === "INFO") severity = "WARNING";
        }
      }

      // 3. Gate change
      if (prev.gate && flight.gate && prev.gate !== flight.gate) {
        changes.push(`Gate changed: ${prev.gate} → ${flight.gate}`);
        if (severity === "INFO") severity = "WARNING";
      }

      // 4. Delay escalation (delay grew by ≥15 min)
      if (flight.delayMinutes > (prev.delayMinutes ?? 0) + 14) {
        const extra = flight.delayMinutes - (prev.delayMinutes ?? 0);
        changes.push(`Delay extended by ${extra} more minutes`);
        severity = "WARNING";
      }

      if (changes.length > 0) {
        const isCancelled = flight.status === "CANCELLED";
        this.notifyFlightUpdate({
          flightNumber: flight.flightNumber,
          airline: flight.airline,
          title: isCancelled
            ? `❌ ${flight.flightNumber} — Flight Cancelled`
            : `🔔 ${flight.flightNumber} — Live Update`,
          message: changes.join(" • ") + (flight.contextNote ? ` — ${flight.contextNote}` : ""),
          severity,
          status: flight.status,
          delayMinutes: flight.delayMinutes,
          delayReason: flight.delayReason,
          estimatedArrival: flight.estimatedArrivalTime,
        });
      }

      // Update snapshot
      this.previousSnapshots.set(flight.flightNumber, {
        status: flight.status,
        estimatedArrivalTime: flight.estimatedArrivalTime,
        estimatedDepartureTime: flight.estimatedDepartureTime,
        gate: flight.gate,
        delayMinutes: flight.delayMinutes,
      });
    }
  }

  /** Clear previous snapshots (e.g., on page load) */
  public resetSnapshots(): void {
    this.previousSnapshots.clear();
  }

  public getNotifications(): InAppNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.saveToStorage();
    this.emit();
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveToStorage();
    this.emit();
  }

  public clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.emit();
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener(this.getNotifications());
    return () => this.listeners.delete(listener);
  }

  /** Subscribe to live toast events (fires once per notification, not batched) */
  public subscribeToToasts(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => this.toastListeners.delete(listener);
  }

  private emit() {
    const list = this.getNotifications();
    this.listeners.forEach((fn) => fn(list));
  }

  private emitToast(item: InAppNotification) {
    this.toastListeners.forEach((fn) => fn(item));
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
      } catch (e) {
        console.error("Failed to persist notifications", e);
      }
    }
  }
}

export const notificationService = new NotificationService();
