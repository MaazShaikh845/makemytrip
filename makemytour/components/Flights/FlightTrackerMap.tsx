// makemytour/components/Flights/FlightTrackerMap.tsx
"use client";

import React from "react";
import { Plane, Compass, Navigation2, Wind, Gauge, ShieldAlert } from "lucide-react";
import { FlightLiveStatus } from "@/lib/api";

interface FlightTrackerMapProps {
  flight: FlightLiveStatus;
}

export default function FlightTrackerMap({ flight }: FlightTrackerMapProps) {
  const progress = Math.max(0, Math.min(100, flight.progressPercentage || 0));

  // Compute curve geometry for an aesthetically pleasing flight arc
  // SVG coordinates: Origin at (70, 150), Destination at (530, 150), Arc peak at (300, 45)
  const x1 = 70;
  const y1 = 140;
  const x2 = 530;
  const y2 = 140;
  const cx = 300;
  const cy = 40;

  // Quadratic bezier calculation B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
  const t = progress / 100;
  const planeX = Math.round((1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2);
  const planeY = Math.round((1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2);

  // Tangent angle calculation for plane rotation
  const dx = 2 * (1 - t) * (cx - x1) + 2 * t * (x2 - cx);
  const dy = 2 * (1 - t) * (cy - y1) + 2 * t * (y2 - cy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div className="relative w-full bg-[#111827] text-white rounded-2xl p-5 overflow-hidden border border-[#374151] shadow-xl font-sans">
      {/* Subtle Radar Screen Grid Backdrop */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#C2410C 1px, transparent 1px), linear-gradient(to right, #374151 1px, transparent 1px), linear-gradient(to bottom, #374151 1px, transparent 1px)",
          backgroundSize: "24px 24px, 40px 40px, 40px 40px",
        }}
      />

      {/* Radar Sweep Sweepline Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="w-[200%] h-[200%] -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(194,65,12,0.4)_60deg,transparent_65deg)] animate-spin duration-[7000ms] rounded-full" />
      </div>

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono font-bold tracking-wider text-emerald-400">
            RADAR ACTIVE • {flight.flightNumber}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-300 font-semibold">{flight.aircraftModel}</span>
        </div>

        <div className="flex items-center space-x-4 font-mono text-[11px] text-gray-300">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>ALT: {flight.altitudeFt ? `${flight.altitudeFt.toLocaleString()} FT` : "GROUND"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>SPD: {flight.speedKnots ? `${flight.speedKnots} KTS` : "0 KTS"}</span>
          </div>
        </div>
      </div>

      {/* SVG Flight Path Radar Map */}
      <div className="relative z-10 w-full overflow-x-auto py-2">
        <svg viewBox="0 0 600 180" className="w-full min-w-[500px] h-36">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset={`${progress}%`} stopColor="#C2410C" />
              <stop offset="100%" stopColor="#4B5563" />
            </linearGradient>

            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Planned flight arc (dashed) */}
          <path
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            fill="none"
            stroke="#374151"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Flown trajectory arc (highlighted gradient) */}
          <path
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3.5"
            filter="url(#radarGlow)"
          />

          {/* Origin Airport Node */}
          <g transform={`translate(${x1}, ${y1})`}>
            <circle r="14" fill="#064E3B" opacity="0.6" className="animate-pulse" />
            <circle r="7" fill="#059669" />
            <circle r="3" fill="#FFFFFF" />
            <text
              y="25"
              textAnchor="middle"
              fill="#A7F3D0"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {flight.origin}
            </text>
          </g>

          {/* Destination Airport Node */}
          <g transform={`translate(${x2}, ${y2})`}>
            <circle r="14" fill="#1E293B" opacity="0.6" />
            <circle r="7" fill="#C2410C" />
            <circle r="3" fill="#FFFFFF" />
            <text
              y="25"
              textAnchor="middle"
              fill="#FDBA74"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {flight.destination}
            </text>
          </g>

          {/* Animated Aircraft Icon along the curve */}
          <g
            transform={`translate(${planeX}, ${planeY}) rotate(${angle})`}
            filter="url(#radarGlow)"
          >
            <circle r="16" fill="#EA580C" opacity="0.25" className="animate-ping" />
            <circle r="11" fill="#C2410C" stroke="#FFFFFF" strokeWidth="2" />
            {/* Plane Silhouette */}
            <path
              d="M 0 -7 L 2 -1 L 7 2 L 2 2 L 2 6 L 5 8 L -5 8 L -2 6 L -2 2 L -7 2 L -2 -1 Z"
              fill="#FFFFFF"
              transform="rotate(90)"
            />
          </g>
        </svg>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-800 text-xs">
        <div>
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">
            Progress
          </span>
          <span className="font-mono text-sm font-black text-amber-400">
            {progress}% Completed
          </span>
        </div>

        <div>
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">
            Est. Remaining
          </span>
          <span className="font-mono text-sm font-black text-white">
            {flight.remainingMinutes !== undefined ? `${flight.remainingMinutes} Mins` : "--"}
          </span>
        </div>

        <div>
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">
            Gate & Terminal
          </span>
          <span className="font-mono text-sm font-black text-sky-400">
            {flight.terminal} / Gate {flight.gate}
          </span>
        </div>

        <div>
          <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-semibold">
            Baggage Carousel
          </span>
          <span className="font-mono text-sm font-black text-emerald-400">
            {flight.baggageCarousel || "TBD"}
          </span>
        </div>
      </div>
    </div>
  );
}
