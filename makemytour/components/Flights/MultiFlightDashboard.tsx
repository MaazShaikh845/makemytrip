// makemytour/components/Flights/MultiFlightDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Radio,
  PinOff,
  MapPin,
  Zap,
  XCircle,
  Navigation2,
  ArrowRight,
} from "lucide-react";
import { FlightLiveStatus } from "@/lib/api";
import Link from "next/link";

interface MultiFlightDashboardProps {
  watchedFlights: FlightLiveStatus[];
  onUnpin: (flightNumber: string) => void;
  onSelect: (flightNumber: string) => void;
  selectedFlightNumber: string;
}

function LiveCountdown({ targetIso }: { targetIso: string }) {
  const [display, setDisplay] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const target = new Date(targetIso).getTime();
      const now = Date.now();
      const diff = target - now;

      if (isNaN(target) || diff <= 0) {
        setDisplay("Arrived");
        return;
      }

      const totalMins = Math.floor(diff / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      if (hours > 0) {
        setDisplay(`${hours}h ${mins}m`);
      } else {
        setDisplay(`${mins}m`);
      }
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [targetIso]);

  return <span>{display || "--"}</span>;
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toUpperCase()) {
    case "DELAYED":
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    case "BOARDING":
    case "GATE_CLOSED":
      return <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" />;
    case "IN_FLIGHT":
    case "DEPARTED":
      return <Plane className="w-3.5 h-3.5 text-purple-500" />;
    case "LANDED":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case "CANCELLED":
      return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    case "ON_TIME":
    default:
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  }
}

function StatusBadge({ flight }: { flight: FlightLiveStatus }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    blue: "bg-sky-100 text-sky-800 border-sky-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    red: "bg-rose-100 text-rose-800 border-rose-300",
    green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  const cls = colorMap[flight.statusColor] ?? colorMap.green;
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${cls} whitespace-nowrap`}>
      {flight.statusDisplay}
    </span>
  );
}

function ProgressBar({ progress, statusColor }: { progress: number; statusColor: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-400",
    blue: "bg-sky-400",
    purple: "bg-purple-500",
    red: "bg-rose-500",
    green: "bg-emerald-500",
  };
  const barColor = colorMap[statusColor] ?? colorMap.green;

  return (
    <div className="w-full h-1.5 bg-[#E6DDD0] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`}
        style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
      />
    </div>
  );
}

export default function MultiFlightDashboard({
  watchedFlights,
  onUnpin,
  onSelect,
  selectedFlightNumber,
}: MultiFlightDashboardProps) {
  if (watchedFlights.length === 0) return null;

  const formatTime = (iso?: string) => {
    if (!iso) return "--:--";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-[#C2410C]/10 rounded-lg">
            <Zap className="w-4 h-4 text-[#C2410C]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#1E293B] tracking-tight">
              Simultaneous Multi-Flight Dashboard
            </h2>
            <p className="text-[10px] text-[#786C60]">
              Live ETA countdowns • Auto-polling every 8s • Dynamic status updates
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#786C60] bg-[#FAF6EF] border border-[#E6DDD0] px-2 py-1 rounded-lg">
          {watchedFlights.length} Tracked
        </span>
      </div>

      {/* Flight cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchedFlights.map((flight) => {
          const isSelected = flight.flightNumber === selectedFlightNumber;
          const isCancelled = flight.status === "CANCELLED";
          const isDelayed = flight.delayMinutes > 0;
          const isAirborne = ["IN_FLIGHT", "DEPARTED"].includes(flight.status.toUpperCase());

          return (
            <div
              key={flight.flightId ? `mfd-${flight.flightId}` : `mfd-${flight.flightNumber}`}
              onClick={() => onSelect(flight.flightNumber)}
              className={`
                relative bg-[#FFFDF9] border rounded-2xl p-4 cursor-pointer
                transition-all duration-200 hover:shadow-md group
                ${isSelected
                  ? "border-[#C2410C] shadow-md ring-1 ring-[#C2410C]/20"
                  : "border-[#E6DDD0] hover:border-[#C2410C]/40"
                }
                ${isCancelled ? "opacity-70" : ""}
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-[#C2410C] animate-ping" />
              )}

              {/* Top row: Flight number + Unpin */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <StatusIcon status={flight.status} />
                  <span className="font-mono font-black text-sm text-[#1E293B]">
                    {flight.flightNumber}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onUnpin(flight.flightNumber); }}
                  title="Remove from watchlist"
                  className="p-1 rounded-lg text-[#786C60] hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                >
                  <PinOff className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Airline */}
              <p className="text-[10px] font-bold text-[#786C60] uppercase tracking-wider mb-2">
                {flight.airline}
              </p>

              {/* Route */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1 text-sm font-black text-[#1E293B]">
                  <MapPin className="w-3 h-3 text-[#C2410C]" />
                  <span>{flight.origin}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#786C60] shrink-0" />
                <div className="flex items-center space-x-1 text-sm font-black text-[#1E293B]">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{flight.destination}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className="mb-3">
                <StatusBadge flight={flight} />
              </div>

              {/* Delay reason */}
              {isDelayed && flight.delayReason && (
                <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-[9px] text-amber-800 font-semibold leading-relaxed line-clamp-2">
                    <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5 text-amber-500" />
                    {flight.delayReason}
                  </p>
                </div>
              )}

              {/* Flight progress bar */}
              <div className="mb-3">
                <ProgressBar
                  progress={flight.progressPercentage}
                  statusColor={flight.statusColor}
                />
                <div className="flex justify-between text-[9px] text-[#786C60] mt-0.5">
                  <span>{flight.origin}</span>
                  <span className="font-mono font-bold text-[#1E293B]">
                    {flight.progressPercentage}%
                  </span>
                  <span>{flight.destination}</span>
                </div>
              </div>

              {/* ETA Section */}
              <div className="border-t border-[#E6DDD0] pt-3 space-y-1.5">
                {/* Scheduled vs Dynamic ETA */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[#786C60] block">Scheduled</span>
                    <span className="font-mono font-bold text-[#1E293B]">
                      {formatTime(flight.scheduledArrivalTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#786C60] block">Dynamic ETA</span>
                    <span className={`font-mono font-bold ${
                      isDelayed ? "text-amber-700" : "text-emerald-700"
                    }`}>
                      {formatTime(flight.estimatedArrivalTime)}
                    </span>
                  </div>
                </div>

                {/* Live countdown */}
                {!isCancelled && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-[#786C60]">
                      <Clock className="w-3 h-3" />
                      <span className="text-[9px] font-semibold">ETA in:</span>
                    </div>
                    <span className={`text-xs font-black font-mono ${
                      isDelayed ? "text-amber-700"
                      : isAirborne ? "text-purple-700"
                      : "text-emerald-700"
                    }`}>
                      <LiveCountdown targetIso={flight.estimatedArrivalTime} />
                    </span>
                  </div>
                )}

                {/* Gate + Terminal */}
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#786C60]">
                    Terminal {flight.terminal} · Gate {flight.gate}
                  </span>
                  {isAirborne && (
                    <div className="flex items-center space-x-1 text-purple-600">
                      <Navigation2 className="w-2.5 h-2.5" />
                      <span className="font-bold">{flight.speedKnots} kts</span>
                    </div>
                  )}
                </div>
              </div>

              {/* "View Details" hover reveal */}
              <Link
                href={`/tracker?flight=${flight.flightNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 w-full py-1.5 rounded-xl border border-[#E6DDD0] text-[10px] font-bold text-[#57534E] hover:bg-[#FAF6EF] hover:border-[#C2410C]/30 hover:text-[#C2410C] transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
              >
                <Plane className="w-3 h-3" />
                <span>Full Radar View</span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
