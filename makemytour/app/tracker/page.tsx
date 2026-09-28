// makemytour/app/tracker/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Search,
  Pin,
  PinOff,
  RefreshCw,
  Sliders,
  MapPin,
  Building,
  Layers,
  Zap,
  CloudRain,
  XCircle,
  DoorClosed,
  Wind,
} from "lucide-react";
import {
  getLiveFlightStatuses,
  simulateFlightUpdate,
  simulateTickTelemetry,
  simulateWeatherEvent,
  FlightLiveStatus,
  SimulationPayload,
} from "@/lib/api";
import { notificationService } from "@/lib/notificationService";
import FlightTrackerMap from "@/components/Flights/FlightTrackerMap";
import MultiFlightDashboard from "@/components/Flights/MultiFlightDashboard";
import FlightStatusToast from "@/components/ui/FlightStatusToast";
import { Button } from "@/components/ui/button";

const WATCHLIST_STORAGE_KEY = "mmt_tracked_flights";

function TrackerContent() {
  const searchParams = useSearchParams();
  const queryFlight = searchParams.get("flight");

  const [allFlights, setAllFlights] = useState<FlightLiveStatus[]>([]);
  const [selectedFlightNumber, setSelectedFlightNumber] = useState<string>("");
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.error("Failed to load watchlist", e);
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAutoStreamActive, setIsAutoStreamActive] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [weatherSimLoading, setWeatherSimLoading] = useState(false);

  // Save Watchlist to LocalStorage
  const updateWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
      } catch (e) {
        console.error("Failed to save watchlist", e);
      }
    }
  };

  const togglePinFlight = (flightNumber: string) => {
    if (watchlist.includes(flightNumber)) {
      updateWatchlist(watchlist.filter((fn) => fn !== flightNumber));
    } else {
      const next = Array.from(new Set([...watchlist, flightNumber]));
      updateWatchlist(next);
      notificationService.notifyFlightUpdate({
        flightNumber,
        airline: "Watchlist",
        title: `📌 Flight ${flightNumber} Added to Watchlist`,
        message: `You are now tracking ${flightNumber} live. Dynamic ETA alerts and push notifications are active.`,
        severity: "INFO",
      });
    }
  };

  // Fetch all flight live statuses from backend mock API (silent background refresh — no notifications)
  const fetchTelemetry = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await getLiveFlightStatuses();
      setAllFlights(data);

      // Default selection if none selected yet
      if (!selectedFlightNumber && data.length > 0) {
        if (queryFlight) {
          const matched = data.find(
            (f) => f.flightNumber.toLowerCase() === queryFlight.toLowerCase()
          );
          setSelectedFlightNumber(matched ? matched.flightNumber : data[0].flightNumber);
        } else {
          setSelectedFlightNumber(data[0].flightNumber);
        }
      }
    } catch (e) {
      console.error("Failed to load flight telemetry", e);
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  }, [queryFlight, selectedFlightNumber]);

  // Initial load
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getLiveFlightStatuses();
        if (!active) return;
        setAllFlights(data);

        if (data.length > 0) {
          if (queryFlight) {
            const matched = data.find(
              (f) => f.flightNumber.toLowerCase() === queryFlight.toLowerCase()
            );
            setSelectedFlightNumber(matched ? matched.flightNumber : data[0].flightNumber);
          } else {
            setSelectedFlightNumber((prev) => prev || data[0].flightNumber);
          }

          setWatchlist((prevWatchlist) => {
            const uniqueSaved = Array.from(new Set(prevWatchlist));
            if (uniqueSaved.length === 0) {
              const initialPins = Array.from(new Set(data.map((f) => f.flightNumber))).slice(0, 2);
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(initialPins));
                } catch {
                  // Ignore storage write error
                }
              }
              return initialPins;
            }
            return uniqueSaved;
          });
        }
      } catch (e) {
        if (!active) return;
        console.error("Failed to load flight telemetry", e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [queryFlight]);

  // Auto-polling every 8 seconds for dynamic ETA & telemetry updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTelemetry(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [fetchTelemetry]);

  // Auto-Stream Simulation Loop (if enabled by user) — silently updates state, no auto-toasts
  useEffect(() => {
    if (!isAutoStreamActive) return;
    const interval = setInterval(async () => {
      try {
        const updated = await simulateTickTelemetry();
        setAllFlights(updated);
      } catch (e) {
        console.error("Tick error", e);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoStreamActive]);

  // Get currently selected flight record
  const selectedFlight = useMemo(() => {
    return (
      allFlights.find((f) => f.flightNumber === selectedFlightNumber) ||
      allFlights[0] ||
      null
    );
  }, [allFlights, selectedFlightNumber]);

  // Get all watched flights for the Multi-Flight Dashboard (deduplicated by flightNumber)
  const watchedFlights = useMemo(() => {
    const seen = new Set<string>();
    return allFlights.filter((f) => {
      if (watchlist.includes(f.flightNumber) && !seen.has(f.flightNumber)) {
        seen.add(f.flightNumber);
        return true;
      }
      return false;
    });
  }, [allFlights, watchlist]);

  // Filtered flights for directory
  const filteredFlights = useMemo(() => {
    return allFlights.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.destination.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "DELAYED" && f.status === "DELAYED") ||
        (statusFilter === "ON_TIME" && f.status === "ON_TIME") ||
        (statusFilter === "BOARDING" && (f.status === "BOARDING" || f.status === "GATE_CLOSED")) ||
        (statusFilter === "IN_FLIGHT" && (f.status === "IN_FLIGHT" || f.status === "DEPARTED")) ||
        (statusFilter === "CANCELLED" && f.status === "CANCELLED");

      return matchesSearch && matchesStatus;
    });
  }, [allFlights, searchQuery, statusFilter]);

  // Execute Simulation Update
  const handleSimulation = async (payload: SimulationPayload, notificationTitle: string) => {
    if (!selectedFlight) return;
    setSimulationLoading(true);
    try {
      const updated = await simulateFlightUpdate(selectedFlight.flightNumber, payload);

      // Update in local state immediately
      setAllFlights((prev) =>
        prev.map((f) => (f.flightNumber === updated.flightNumber ? updated : f))
      );

      // Determine severity from context
      let severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL" = "INFO";
      if (payload.status === "CANCELLED") severity = "CRITICAL";
      else if (payload.delayMinutes && payload.delayMinutes > 0) severity = "WARNING";
      else if (payload.status === "BOARDING" || payload.status === "ON_TIME") severity = "SUCCESS";
      else if (payload.status === "IN_FLIGHT" || payload.status === "DEPARTED") severity = "INFO";

      // Push notification trigger
      notificationService.notifyFlightUpdate({
        flightNumber: updated.flightNumber,
        airline: updated.airline,
        title: notificationTitle,
        message: `${updated.airline} ${updated.flightNumber} — "${updated.statusDisplay}". ${
          payload.delayReason || updated.contextNote || ""
        }`,
        severity,
        status: updated.status,
        delayMinutes: updated.delayMinutes,
        delayReason: updated.delayReason,
        estimatedArrival: updated.estimatedArrivalTime,
      });
    } catch (e: unknown) {
      console.error("Simulation failed", e);
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert("Simulation failed: " + (err.response?.data?.message || err.message || "Unknown error"));
    } finally {
      setSimulationLoading(false);
    }
  };

  // Execute System-Wide Weather Event
  const handleWeatherEvent = async () => {
    setWeatherSimLoading(true);
    try {
      const updated = await simulateWeatherEvent();
      setAllFlights(updated);
      notificationService.notifyFlightUpdate({
        flightNumber: "ALL",
        airline: "MakeMyTour Operations",
        title: "⛈ System-Wide Weather Alert Issued",
        message: "All ground-based flights are experiencing weather-related delays. Updated ETAs will stream in real-time.",
        severity: "CRITICAL",
      });
    } catch (e: unknown) {
      console.error("Weather simulation failed", e);
    } finally {
      setWeatherSimLoading(false);
    }
  };

  const formatIsoTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const formatIsoDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  const getStatusBadgeClass = (statusColor: string) => {
    switch (statusColor) {
      case "amber":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "blue":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "purple":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "red":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "green":
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  const getTimelineEventColor = (severity: string) => {
    switch (severity) {
      case "WARNING": return "bg-amber-500 border-amber-200";
      case "SUCCESS": return "bg-emerald-500 border-emerald-200";
      case "CRITICAL": return "bg-rose-500 border-rose-200";
      case "INFO":
      default: return "bg-[#C2410C] border-orange-200";
    }
  };

  const getTimelinePillClass = (severity: string) => {
    switch (severity) {
      case "WARNING": return "bg-amber-100 text-amber-800 border-amber-300";
      case "SUCCESS": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "CRITICAL": return "bg-rose-100 text-rose-800 border-rose-300";
      default: return "bg-sky-100 text-sky-800 border-sky-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#C2410C] text-white flex items-center justify-center mb-4 shadow-lg animate-bounce">
          <Plane className="w-8 h-8 transform -rotate-12" />
        </div>
        <h2 className="text-xl font-black text-[#1E293B]">Connecting to Flight Radar API…</h2>
        <p className="text-xs text-[#786C60] mt-1">Calibrating live mock telemetry &amp; satellite radar channels.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#1E293B] pb-20">
      {/* Global toast overlay */}
      <FlightStatusToast />

      {/* Top Header Station Banner */}
      <div className="bg-[#FFFDF9] border-b border-[#E6DDD0] sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Station Title & Pulse */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#C2410C] text-white rounded-xl shadow-xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-[#1E293B] tracking-tight">
                  Live Flight Radar &amp; Multi-Tracker
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-[#786C60]">
                Real-time simulated telemetry • Dynamic ETA calculations • Auto push notifications
              </p>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* Auto-stream ticker toggle */}
            <button
              onClick={() => setIsAutoStreamActive(!isAutoStreamActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                isAutoStreamActive
                  ? "bg-[#C2410C] text-white border-[#9A3412] shadow-xs"
                  : "bg-[#FFFDF9] text-[#57534E] border-[#E6DDD0] hover:bg-[#F3EBDD]"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoStreamActive ? "animate-spin" : ""}`} />
              <span>{isAutoStreamActive ? "Auto-Stream: ON" : "Auto-Stream: OFF"}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchTelemetry()}
              disabled={refreshing}
              className="p-2 rounded-xl bg-[#FFFDF9] text-[#57534E] hover:text-[#1E293B] border border-[#E6DDD0] hover:bg-[#F3EBDD] transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#C2410C]" : ""}`} />
            </button>
          </div>
        </div>

        {/* MULTI-FLIGHT SIMULTANEOUS WATCHLIST TRAY */}
        <div className="border-t border-[#E6DDD0]/80 bg-[#FAF6EF]/60 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-[#57534E] flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Watchlist ({watchlist.length}):</span>
            </span>

            {watchedFlights.length === 0 ? (
              <span className="text-xs text-[#786C60] italic">
                No flights pinned. Click the pin icon on any flight to monitor simultaneously!
              </span>
            ) : (
              watchedFlights.map((wf) => {
                const isSelected = wf.flightNumber === selectedFlightNumber;
                return (
                  <button
                    key={wf.flightId ? `wf-${wf.flightId}` : `wf-${wf.flightNumber}`}
                    onClick={() => setSelectedFlightNumber(wf.flightNumber)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#1E293B] text-white border-[#1E293B] shadow-xs"
                        : "bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] hover:border-[#C2410C]"
                    }`}
                  >
                    <span className="font-mono">{wf.flightNumber}</span>
                    <span className="text-[11px] opacity-75">
                      {wf.origin} → {wf.destination}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getStatusBadgeClass(
                        wf.statusColor
                      )}`}
                    >
                      {wf.statusDisplay}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinFlight(wf.flightNumber);
                      }}
                      title="Unpin flight"
                      className="hover:text-rose-400 p-0.5"
                    >
                      ×
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MULTI-FLIGHT DASHBOARD — shown when ≥1 flight pinned */}
      {watchedFlights.length > 0 && (
        <div className="border-b border-[#E6DDD0] bg-[#FFFDF9]/70">
          <MultiFlightDashboard
            watchedFlights={watchedFlights}
            onUnpin={togglePinFlight}
            onSelect={setSelectedFlightNumber}
            selectedFlightNumber={selectedFlightNumber}
          />
        </div>
      )}

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLS: SELECTED FLIGHT LIVE RADAR & TELEMETRY */}
          <div className="lg:col-span-8 space-y-6">
            {selectedFlight ? (
              <>
                {/* Visual SVG Radar Map & Telemetry HUD */}
                <FlightTrackerMap flight={selectedFlight} />

                {/* Primary Flight Status Header Card */}
                <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DDD0] pb-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-black text-[#1E293B]">
                          {selectedFlight.airline}
                        </span>
                        <span className="text-xl font-mono font-bold text-[#C2410C] bg-[#FAF6EF] px-2.5 py-0.5 rounded-lg border border-[#E6DDD0]">
                          {selectedFlight.flightNumber}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#786C60] mt-0.5">
                        Aircraft: {selectedFlight.aircraftModel} • Terminal {selectedFlight.terminal}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Live Status Chip */}
                      <span
                        className={`text-sm px-3.5 py-1.5 rounded-xl font-black border tracking-wide uppercase shadow-xs ${getStatusBadgeClass(
                          selectedFlight.statusColor
                        )}`}
                      >
                        {selectedFlight.statusDisplay}
                      </span>

                      {/* Pin Watchlist Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePinFlight(selectedFlight.flightNumber)}
                        className={`rounded-xl border font-bold text-xs ${
                          watchlist.includes(selectedFlight.flightNumber)
                            ? "bg-[#C2410C]/10 text-[#C2410C] border-[#C2410C]/30"
                            : "border-[#E6DDD0] text-[#57534E] hover:bg-[#F3EBDD]"
                        }`}
                      >
                        {watchlist.includes(selectedFlight.flightNumber) ? (
                          <>
                            <PinOff className="w-3.5 h-3.5 mr-1" />
                            <span>Unpin</span>
                          </>
                        ) : (
                          <>
                            <Pin className="w-3.5 h-3.5 mr-1" />
                            <span>Pin Multi-Track</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* CANCELLED Alert */}
                  {selectedFlight.status === "CANCELLED" && (
                    <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-900">
                      <div className="flex items-start space-x-3">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">
                            Flight Cancelled
                          </h4>
                          <p className="text-sm font-bold text-[#1E293B] mt-1">
                            {selectedFlight.delayReason || "This flight has been cancelled due to operational reasons."}
                          </p>
                          {selectedFlight.contextNote && (
                            <p className="text-xs text-rose-900 mt-1">{selectedFlight.contextNote}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTEXTUAL DELAY REASON ALERT (If Delayed) */}
                  {selectedFlight.status !== "CANCELLED" && selectedFlight.delayMinutes > 0 && (
                    <div className="mb-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                            Delay Notification Context ({selectedFlight.delayMinutes} min delay)
                          </h4>
                          <p className="text-sm font-bold text-[#1E293B] mt-1">
                            {selectedFlight.delayReason || "Operational delay reported by ground air traffic dispatch."}
                          </p>
                          {selectedFlight.contextNote && (
                            <p className="text-xs text-amber-950 mt-1">
                              {selectedFlight.contextNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* On-Time / Boarding Context Banner (If not delayed) */}
                  {selectedFlight.delayMinutes === 0 && selectedFlight.contextNote && selectedFlight.status !== "CANCELLED" && (
                    <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-xs font-bold text-[#1E293B]">
                        <span>Flight Context: </span>
                        <span className="font-normal text-[#57534E]">{selectedFlight.contextNote}</span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Departure & Arrival Comparison Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Departure Details */}
                    <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E6DDD0]">
                      <div className="flex items-center justify-between text-xs text-[#786C60] mb-2 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-[#C2410C]">
                          <MapPin className="w-3.5 h-3.5" /> Origin
                        </span>
                        <span>{formatIsoDate(selectedFlight.scheduledDepartureTime)}</span>
                      </div>

                      <div className="text-2xl font-black text-[#1E293B]">
                        {selectedFlight.origin}
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E6DDD0] space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#786C60]">Scheduled Departure:</span>
                          <span className="font-mono font-bold text-[#1E293B]">
                            {formatIsoTime(selectedFlight.scheduledDepartureTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#786C60]">Estimated / Revised:</span>
                          <span
                            className={`font-mono font-bold ${
                              selectedFlight.delayMinutes > 0
                                ? "text-amber-700 font-black"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatIsoTime(selectedFlight.estimatedDepartureTime)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-[#786C60]">Departure Gate:</span>
                          <span className="font-bold text-[#1E293B]">
                            Terminal {selectedFlight.terminal} • Gate {selectedFlight.gate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Arrival Details */}
                    <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E6DDD0]">
                      <div className="flex items-center justify-between text-xs text-[#786C60] mb-2 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-[#047857]">
                          <MapPin className="w-3.5 h-3.5" /> Destination
                        </span>
                        <span>{formatIsoDate(selectedFlight.scheduledArrivalTime)}</span>
                      </div>

                      <div className="text-2xl font-black text-[#1E293B]">
                        {selectedFlight.destination}
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E6DDD0] space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#786C60]">Scheduled Arrival:</span>
                          <span className="font-mono font-bold text-[#1E293B]">
                            {formatIsoTime(selectedFlight.scheduledArrivalTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#786C60]">Dynamic Estimated ETA:</span>
                          <span
                            className={`font-mono font-bold ${
                              selectedFlight.delayMinutes > 0
                                ? "text-amber-700 font-black"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatIsoTime(selectedFlight.estimatedArrivalTime)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-[#786C60]">Baggage Claim:</span>
                          <span className="font-bold text-[#1E293B]">
                            {selectedFlight.baggageCarousel || "Baggage Belt 4"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Timeline History */}
                <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-black text-[#1E293B] mb-3 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#C2410C]" />
                    <span>Live Operational Event Timeline</span>
                  </h3>

                  {selectedFlight.timeline && selectedFlight.timeline.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E6DDD0]">
                      {selectedFlight.timeline.map((event, idx) => (
                        <div key={idx} className="relative flex items-start pl-8">
                          <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${getTimelineEventColor(event.severity)}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-bold text-[#1E293B]">
                                {event.title}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${getTimelinePillClass(event.severity)}`}>
                                  {event.severity}
                                </span>
                                <span className="text-[10px] text-[#786C60] font-mono">
                                  {formatIsoTime(event.timestamp)}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-[#57534E] mt-0.5">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#786C60]">No events recorded for this sector yet.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-8 text-center">
                <Plane className="w-10 h-10 text-[#C2410C] mx-auto mb-2 opacity-50" />
                <p className="font-bold text-[#1E293B]">Select a flight to view live radar tracking</p>
              </div>
            )}
          </div>

          {/* RIGHT 4 COLS: SIMULATION CONSOLE & FLIGHT DIRECTORY */}
          <div className="lg:col-span-4 space-y-6">
            {/* INTERACTIVE SIMULATION CONTROL PANEL */}
            <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-[#1E293B] flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#C2410C]" />
                  <span>Mock API Simulator</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#786C60]">
                  Target: {selectedFlight ? selectedFlight.flightNumber : "--"}
                </span>
              </div>

              <p className="text-xs text-[#786C60] mb-4">
                Trigger real-time telemetry events to test push notifications, delay contexts, and dynamic arrival updates:
              </p>

              <div className="space-y-2">
                {/* 1. Simulate 1 Hour Delay */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "DELAYED",
                        delayMinutes: 60,
                        delayReason:
                          "Air traffic hold over airspace due to severe monsoon rain and crosswinds.",
                        contextNote:
                          "Revised departure slot issued. Inbound passengers deplaning.",
                      },
                      `⚠️ Flight ${selectedFlight?.flightNumber} Delayed by 1h`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Simulate &quot;Delayed by 1h&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono bg-amber-200/60 px-2 py-0.5 rounded">
                    +60m
                  </span>
                </button>

                {/* 2. Simulate 30 Min Delay (ATC Congestion) */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "DELAYED",
                        delayMinutes: 30,
                        delayReason:
                          "Runway congestion & holding pattern at destination airport.",
                        contextNote: "Captain reports pushback clearance momentarily.",
                      },
                      `⚠️ Flight ${selectedFlight?.flightNumber} Delayed by 30m`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-amber-50/60 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Simulate &quot;Delayed by 30m&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono bg-amber-200/40 px-2 py-0.5 rounded">
                    +30m
                  </span>
                </button>

                {/* 3. Simulate Boarding Call */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "BOARDING",
                        delayMinutes: 0,
                        contextNote: `Now boarding all ticketed passengers at Gate ${selectedFlight?.gate || "12B"}. Have boarding pass ready.`,
                      },
                      `📢 Boarding Call: Flight ${selectedFlight?.flightNumber}`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-bold text-sky-900 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-600" />
                    <span>Simulate &quot;Boarding&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono bg-sky-200/60 px-2 py-0.5 rounded">
                    Gate Call
                  </span>
                </button>

                {/* 4. Simulate Gate Closed */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "GATE_CLOSED",
                        contextNote: `Gate doors sealed for ${selectedFlight?.flightNumber}. Pushback in progress.`,
                      },
                      `🚪 Gate Closed: Flight ${selectedFlight?.flightNumber}`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-sky-50/60 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold text-sky-800 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <DoorClosed className="w-4 h-4 text-sky-500" />
                    <span>Simulate &quot;Gate Closed&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono bg-sky-200/40 px-2 py-0.5 rounded">
                    Pushback
                  </span>
                </button>

                {/* 5. Simulate Airborne / In Flight */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "IN_FLIGHT",
                        progressPercentage: 45,
                        contextNote:
                          "Flight airborne, cruising smoothly at 34,000 ft. In-flight service begun.",
                      },
                      `✈️ Flight ${selectedFlight?.flightNumber} Airborne`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-xl text-xs font-bold text-purple-900 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-purple-600" />
                    <span>Simulate &quot;Airborne / In Flight&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono bg-purple-200/60 px-2 py-0.5 rounded">
                    Cruise
                  </span>
                </button>

                {/* 6. Simulate Gate Change */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() => {
                    const newGate = (14 + Math.floor(Math.random() * 20)) + "B";
                    handleSimulation(
                      {
                        gate: newGate,
                        contextNote: `Gate reassignment: Aircraft moved to Terminal ${selectedFlight?.terminal} Gate ${newGate}.`,
                      },
                      `🚪 Gate Changed to ${newGate} — Flight ${selectedFlight?.flightNumber}`
                    );
                  }}
                  className="w-full py-2 px-3 bg-[#FAF6EF] hover:bg-[#F3EBDD] border border-[#E6DDD0] rounded-xl text-xs font-bold text-[#57534E] transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>Simulate Gate Change</span>
                  </span>
                  <span className="text-[10px] text-[#786C60]">Random Gate</span>
                </button>

                {/* 7. NEW: Simulate Weather Delay (single flight) */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      { status: "WEATHER_DELAY" },
                      `⛈ Weather Delay: Flight ${selectedFlight?.flightNumber}`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-slate-500" />
                    <span>Simulate Weather Delay</span>
                  </span>
                  <span className="text-[10px] font-mono bg-slate-200/60 px-2 py-0.5 rounded">
                    Random
                  </span>
                </button>

                {/* 8. NEW: Simulate Flight Cancelled */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "CANCELLED",
                        delayReason: "Flight cancelled due to unresolved mechanical issue requiring extended maintenance.",
                        contextNote: "Please proceed to the airline service desk for rebooking on the next available flight.",
                      },
                      `❌ CANCELLED: Flight ${selectedFlight?.flightNumber}`
                    )
                  }
                  className="w-full py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold text-rose-900 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Simulate &quot;Cancelled&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono bg-rose-200/60 px-2 py-0.5 rounded">
                    Critical
                  </span>
                </button>

                {/* 9. Reset to On Time */}
                <button
                  disabled={simulationLoading || !selectedFlight}
                  onClick={() =>
                    handleSimulation(
                      {
                        status: "ON_TIME",
                        delayMinutes: 0,
                        delayReason: "",
                        contextNote:
                          "Schedule normalized. Operating strictly on time with no holds.",
                      },
                      `✅ Flight ${selectedFlight?.flightNumber} Status: On Time`
                    )
                  }
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset to &quot;On Time&quot;</span>
                  </span>
                  <span className="text-[10px] font-mono">0m Delay</span>
                </button>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E6DDD0]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#FFFDF9] px-2 text-[10px] font-bold text-[#786C60] uppercase tracking-wider">
                      System-Wide
                    </span>
                  </div>
                </div>

                {/* 10. NEW: System-Wide Weather Event */}
                <button
                  disabled={weatherSimLoading}
                  onClick={handleWeatherEvent}
                  className="w-full py-2.5 px-3.5 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Wind className={`w-4 h-4 text-slate-600 ${weatherSimLoading ? "animate-spin" : ""}`} />
                    <span>⛈ System-Wide Weather Event</span>
                  </span>
                  <span className="text-[10px] font-mono bg-slate-200/60 px-2 py-0.5 rounded">
                    All Flights
                  </span>
                </button>
              </div>
            </div>

            {/* FLIGHT DIRECTORY & MULTI-TRACK SELECTION */}
            <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-[#1E293B] flex items-center space-x-2">
                  <Plane className="w-4 h-4 text-[#C2410C]" />
                  <span>Available Fleet ({allFlights.length})</span>
                </h3>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-[#786C60] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search flight #, airline, city…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl text-xs font-medium text-[#1E293B] placeholder-[#A89F91] focus:outline-none focus:border-[#C2410C]"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-[10px] font-bold">
                {["ALL", "DELAYED", "BOARDING", "IN_FLIGHT", "ON_TIME", "CANCELLED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-colors ${
                      statusFilter === tab
                        ? "bg-[#C2410C] text-white border-[#9A3412]"
                        : "bg-[#FAF6EF] text-[#57534E] border-[#E6DDD0] hover:bg-[#F3EBDD]"
                    }`}
                  >
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Flight List */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 divide-y divide-[#E6DDD0]/50">
                {filteredFlights.length === 0 ? (
                  <p className="text-xs text-[#786C60] text-center py-6">
                    No flights matching criteria.
                  </p>
                ) : (
                  filteredFlights.map((flight) => {
                    const isSelected = flight.flightNumber === selectedFlightNumber;
                    const isPinned = watchlist.includes(flight.flightNumber);

                    return (
                      <div
                        key={flight.flightId ? `dir-${flight.flightId}` : `dir-${flight.flightNumber}-${flight.origin}-${flight.destination}`}
                        onClick={() => setSelectedFlightNumber(flight.flightNumber)}
                        className={`pt-2.5 pb-2.5 px-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#C2410C]/5 border-[#C2410C] shadow-xs"
                            : "bg-[#FFFDF9] border-transparent hover:border-[#E6DDD0] hover:bg-[#FAF6EF]"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#1E293B]">
                              {flight.flightNumber}
                            </span>
                            <span className="text-[11px] text-[#786C60] truncate">
                              {flight.airline}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-[#57534E] mt-0.5">
                            {flight.origin} → {flight.destination}
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${getStatusBadgeClass(
                                flight.statusColor
                              )}`}
                            >
                              {flight.statusDisplay}
                            </span>
                            <span className="text-[10px] text-[#786C60] font-mono">
                              ETA {formatIsoTime(flight.estimatedArrivalTime)}
                            </span>
                          </div>
                        </div>

                        {/* Pin / Track Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinFlight(flight.flightNumber);
                          }}
                          title={isPinned ? "Remove from watchlist" : "Track simultaneously"}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isPinned
                              ? "bg-[#C2410C] text-white border-[#9A3412]"
                              : "bg-[#FAF6EF] text-[#786C60] border-[#E6DDD0] hover:text-[#C2410C]"
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveFlightTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#C2410C] text-white flex items-center justify-center mb-3 shadow-md animate-bounce">
            <Plane className="w-6 h-6 transform -rotate-12" />
          </div>
          <p className="text-xs font-bold text-[#1E293B]">Loading Live Radar Station…</p>
        </div>
      }
    >
      <TrackerContent />
    </Suspense>
  );
}
