// makemytour/components/ui/NotificationCenter.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  ExternalLink,
  Trash2,
  Radio,
  Filter,
} from "lucide-react";
import {
  notificationService,
  InAppNotification,
} from "@/lib/notificationService";
import Link from "next/link";

type FilterTab = "ALL" | "DELAYS" | "BOARDING" | "INFO";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>(() =>
    typeof window !== "undefined" ? notificationService.getPushPermission() : "default"
  );
  const [soundEnabled, setSoundEnabled] = useState(() =>
    typeof window !== "undefined" ? notificationService.isSoundEnabled() : true
  );
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((list) => {
      setNotifications(list);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRequestPush = async () => {
    const res = await notificationService.requestPushPermission();
    setPushStatus(res);
    if (res === "granted") {
      notificationService.notifyFlightUpdate({
        flightNumber: "SYSTEM",
        airline: "MakeMyTour",
        title: "🔔 Push Notifications Active",
        message: "You will now receive live flight status, gate changes, and delay alerts in real time!",
        severity: "SUCCESS",
      });
    }
  };

  const handleToggleSound = () => {
    const enabled = notificationService.toggleSound();
    setSoundEnabled(enabled);
    if (enabled) {
      notificationService.playAirportChime("SUCCESS");
    }
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "WARNING":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          border: "border-l-amber-400",
          bg: "bg-amber-50/30",
        };
      case "SUCCESS":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          border: "border-l-emerald-400",
          bg: "bg-emerald-50/30",
        };
      case "CRITICAL":
        return {
          icon: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
          border: "border-l-rose-500",
          bg: "bg-rose-50/30",
        };
      case "INFO":
      default:
        return {
          icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
          border: "border-l-sky-400",
          bg: "bg-sky-50/20",
        };
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return null; }
  };

  const getFilteredNotifications = () => {
    switch (activeFilter) {
      case "DELAYS":
        return notifications.filter(
          (n) => n.severity === "WARNING" || n.severity === "CRITICAL" || (n.delayMinutes && n.delayMinutes > 0)
        );
      case "BOARDING":
        return notifications.filter(
          (n) => n.status === "BOARDING" || n.status === "GATE_CLOSED" || n.title.toLowerCase().includes("board")
        );
      case "INFO":
        return notifications.filter(
          (n) => n.severity === "INFO" || n.severity === "SUCCESS"
        );
      case "ALL":
      default:
        return notifications;
    }
  };

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "DELAYS", label: "Delays" },
    { key: "BOARDING", label: "Boarding" },
    { key: "INFO", label: "Info" },
  ];

  const filteredNotifications = getFilteredNotifications();
  const delayCount = notifications.filter((n) => n.severity === "WARNING" || n.severity === "CRITICAL").length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            notificationService.markAllAsRead();
          }
        }}
        aria-label="Flight Notifications"
        className="relative p-2 rounded-xl text-[#57534E] hover:text-[#1E293B] hover:bg-[#F3EBDD] border border-transparent hover:border-[#E6DDD0] transition-all cursor-pointer flex items-center justify-center"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-[#C2410C]" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#C2410C] text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-[400px] bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-[#E6DDD0] bg-[#FAF6EF]/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#C2410C]/10 text-[#C2410C] rounded-lg">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[#1E293B] tracking-tight">
                    Flight Radar Alerts
                  </h3>
                  <p className="text-[10px] text-[#786C60]">
                    {notifications.length} total · {delayCount} delay alert{delayCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Sound Toggle */}
                <button
                  onClick={handleToggleSound}
                  title={soundEnabled ? "Mute airport chime" : "Unmute airport chime"}
                  className="p-1.5 text-[#786C60] hover:text-[#1E293B] hover:bg-[#EAE0CF] rounded-lg transition-colors cursor-pointer"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#047857]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-[#786C60]" />
                  )}
                </button>

                {/* Clear all */}
                {notifications.length > 0 && (
                  <button
                    onClick={() => notificationService.clearAll()}
                    title="Clear all alerts"
                    className="p-1.5 text-[#786C60] hover:text-[#BE123C] hover:bg-[#BE123C]/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-3">
              <Filter className="w-3 h-3 text-[#786C60] shrink-0" />
              {FILTER_TABS.map((tab) => {
                const count = tab.key === "ALL"
                  ? notifications.length
                  : tab.key === "DELAYS"
                  ? notifications.filter((n) => n.severity === "WARNING" || n.severity === "CRITICAL" || (n.delayMinutes && n.delayMinutes > 0)).length
                  : tab.key === "BOARDING"
                  ? notifications.filter((n) => n.status === "BOARDING" || n.status === "GATE_CLOSED" || n.title.toLowerCase().includes("board")).length
                  : notifications.filter((n) => n.severity === "INFO" || n.severity === "SUCCESS").length;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                      activeFilter === tab.key
                        ? "bg-[#C2410C] text-white"
                        : "bg-white text-[#57534E] hover:bg-[#FAF6EF] border border-[#E6DDD0]"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`ml-1 text-[9px] font-black rounded-full px-1 ${
                        activeFilter === tab.key ? "bg-white/30 text-white" : "bg-[#FAF6EF] text-[#786C60]"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Push Notification Opt-in Prompt Banner if not granted */}
          {pushStatus !== "granted" && (
            <div className="px-3.5 py-2.5 bg-[#C2410C]/10 border-b border-[#C2410C]/20 flex items-center justify-between gap-2">
              <div className="text-[11px] text-[#1E293B] leading-tight">
                <span className="font-bold">Enable Desktop Push:</span> Receive instant popup notifications for delays &amp; boarding.
              </div>
              <button
                onClick={handleRequestPush}
                className="text-[10px] font-bold uppercase tracking-wider bg-[#C2410C] text-white px-2.5 py-1 rounded-lg hover:bg-[#9A3412] shrink-0 transition-colors cursor-pointer"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#E6DDD0]/60">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#FAF6EF] border border-[#E6DDD0] flex items-center justify-center text-[#786C60]">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-bold text-[#1E293B]">
                  {activeFilter === "ALL" ? "All caught up" : `No ${activeFilter.toLowerCase()} alerts`}
                </p>
                <p className="text-[11px] text-[#786C60] mt-0.5">
                  Live flight status updates will stream here automatically.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const style = getSeverityStyle(item.severity);
                const eta = formatTime(item.estimatedArrival);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    className={`
                      p-3 transition-colors cursor-pointer border-l-4 border-r-0 border-t-0 border-b-0
                      ${style.border} ${style.bg}
                      ${!item.read ? "bg-[#C2410C]/5" : "hover:bg-[#FAF6EF]/60"}
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      {style.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-bold text-[#1E293B] truncate ${!item.read ? "font-black" : ""}`}>
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {!item.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" title="Unread" />
                            )}
                            <span className="text-[10px] text-[#786C60] whitespace-nowrap">
                              {formatTimeAgo(item.timestamp)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#57534E] leading-relaxed">
                          {item.message}
                        </p>

                        {/* Delay Context */}
                        {item.delayReason && (
                          <div className="mt-1.5 p-1.5 rounded-lg bg-[#FAF6EF] border border-[#E6DDD0] text-[10px] text-[#786C60]">
                            <span className="font-bold text-[#C2410C]">Context: </span>
                            {item.delayReason}
                          </div>
                        )}

                        {/* ETA display */}
                        {eta && (
                          <div className="mt-1 flex items-center gap-1 text-[10px]">
                            <span className="text-[#786C60]">Dynamic ETA:</span>
                            <span className={`font-mono font-black ${
                              item.severity === "WARNING" ? "text-amber-700" : "text-emerald-700"
                            }`}>
                              {eta}
                            </span>
                          </div>
                        )}

                        {/* Flight Tag & Quick Tracker Link */}
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF6EF] border border-[#E6DDD0] font-mono font-bold text-[#1E293B]">
                            {item.flightNumber}
                          </span>

                          {item.flightNumber !== "SYSTEM" && (
                            <Link
                              href={`/tracker?flight=${item.flightNumber}`}
                              onClick={() => setIsOpen(false)}
                              className="text-[#C2410C] hover:underline font-bold flex items-center gap-0.5"
                            >
                              <span>Track Live</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FAF6EF]/60 border-t border-[#E6DDD0] flex items-center justify-between">
            {notifications.length > 0 && (
              <span className="text-[10px] text-[#786C60]">
                Click a notification to mark as read
              </span>
            )}
            <Link
              href="/tracker"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#C2410C] hover:text-[#9A3412] transition-colors ml-auto"
            >
              Open Live Radar Station →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
