"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plane,
  Armchair,
  Sparkles,
  Zap,
  Info,
  Check,
  ShieldCheck,
  Users,
  RefreshCw,
  Compass,
  ArrowRight,
  BookmarkCheck,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSavedPreferences,
  savePreferences,
  FlightSeatPreference,
} from "@/lib/preferences";

export type SeatClass = "business" | "premium" | "exit-row" | "standard";
export type SeatPosition = "window" | "middle" | "aisle";
export type SeatStatus = "available" | "occupied" | "selected" | "reserved";

export interface SeatData {
  id: string; // e.g. "12A"
  row: number;
  col: "A" | "B" | "C" | "D" | "E" | "F";
  seatClass: SeatClass;
  position: SeatPosition;
  price: number;
  pitch: string; // e.g. "36 in"
  recline: string;
  hasPower: boolean;
  hasScreen: boolean;
  status: SeatStatus;
  passengerIndex?: number; // 0-indexed passenger
}

interface InteractiveSeatMapProps {
  ticketCount: number;
  selectedSeats: SeatData[];
  onSeatsChange: (seats: SeatData[], totalSeatFees: number) => void;
  flightNumber?: string;
  aircraft?: string;
}

// Generate base seat layout for an Airbus A320 / Boeing 737
function generateInitialSeats(): SeatData[] {
  const seats: SeatData[] = [];

  // Rows 1 - 3: Business Class (2-2 configuration: A, C - aisle - D, F)
  for (let r = 1; r <= 3; r++) {
    const cols: ("A" | "C" | "D" | "F")[] = ["A", "C", "D", "F"];
    cols.forEach((col) => {
      const isWindow = col === "A" || col === "F";
      // deterministic occupied mock
      const isOcc = (r === 1 && col === "C") || (r === 2 && col === "D");
      seats.push({
        id: `${r}${col}`,
        row: r,
        col: col as any,
        seatClass: "business",
        position: isWindow ? "window" : "aisle",
        price: 3200,
        pitch: "42 inches (180° Lie-Flat)",
        recline: "Full Flat Bed",
        hasPower: true,
        hasScreen: true,
        status: isOcc ? "occupied" : "available",
      });
    });
  }

  // Rows 4 - 6: Premium Economy / Preferred (3-3: A, B, C - D, E, F)
  for (let r = 4; r <= 6; r++) {
    const cols: ("A" | "B" | "C" | "D" | "E" | "F")[] = ["A", "B", "C", "D", "E", "F"];
    cols.forEach((col) => {
      const isWindow = col === "A" || col === "F";
      const isAisle = col === "C" || col === "D";
      const pos: SeatPosition = isWindow ? "window" : isAisle ? "aisle" : "middle";
      const isOcc = (r === 4 && (col === "A" || col === "B")) || (r === 5 && col === "F");
      seats.push({
        id: `${r}${col}`,
        row: r,
        col,
        seatClass: "premium",
        position: pos,
        price: isWindow || isAisle ? 950 : 650,
        pitch: "35 inches (+4\" extra legroom)",
        recline: "7 inches deep",
        hasPower: true,
        hasScreen: true,
        status: isOcc ? "occupied" : "available",
      });
    });
  }

  // Rows 7 - 11: Standard Front Economy
  for (let r = 7; r <= 11; r++) {
    const cols: ("A" | "B" | "C" | "D" | "E" | "F")[] = ["A", "B", "C", "D", "E", "F"];
    cols.forEach((col) => {
      const isWindow = col === "A" || col === "F";
      const isAisle = col === "C" || col === "D";
      const pos: SeatPosition = isWindow ? "window" : isAisle ? "aisle" : "middle";
      const isOcc = (r === 8 && col === "A") || (r === 10 && col === "C") || (r === 11 && col === "E");
      seats.push({
        id: `${r}${col}`,
        row: r,
        col,
        seatClass: "standard",
        position: pos,
        price: isWindow || isAisle ? 350 : 0,
        pitch: "31 inches standard",
        recline: "4 inches standard",
        hasPower: true,
        hasScreen: false,
        status: isOcc ? "occupied" : "available",
      });
    });
  }

  // Rows 12 - 13: Emergency Exit Rows with Extra Legroom
  for (let r = 12; r <= 13; r++) {
    const cols: ("A" | "B" | "C" | "D" | "E" | "F")[] = ["A", "B", "C", "D", "E", "F"];
    cols.forEach((col) => {
      const isWindow = col === "A" || col === "F";
      const isAisle = col === "C" || col === "D";
      const pos: SeatPosition = isWindow ? "window" : isAisle ? "aisle" : "middle";
      const isOcc = r === 12 && col === "F";
      seats.push({
        id: `${r}${col}`,
        row: r,
        col,
        seatClass: "exit-row",
        position: pos,
        price: 850,
        pitch: "38 inches (Maximum Legroom)",
        recline: r === 12 ? "Fixed (Exit Row)" : "5 inches",
        hasPower: true,
        hasScreen: false,
        status: isOcc ? "occupied" : "available",
      });
    });
  }

  // Rows 14 - 20: Standard Economy
  for (let r = 14; r <= 20; r++) {
    const cols: ("A" | "B" | "C" | "D" | "E" | "F")[] = ["A", "B", "C", "D", "E", "F"];
    cols.forEach((col) => {
      const isWindow = col === "A" || col === "F";
      const isAisle = col === "C" || col === "D";
      const pos: SeatPosition = isWindow ? "window" : isAisle ? "aisle" : "middle";
      const isOcc = (r === 15 && (col === "A" || col === "B")) || (r === 18 && col === "D") || (r === 20 && col === "C");
      seats.push({
        id: `${r}${col}`,
        row: r,
        col,
        seatClass: "standard",
        position: pos,
        price: isWindow || isAisle ? 250 : 0,
        pitch: "31 inches standard",
        recline: "4 inches standard",
        hasPower: false,
        hasScreen: false,
        status: isOcc ? "occupied" : "available",
      });
    });
  }

  return seats;
}

export default function InteractiveSeatMap({
  ticketCount,
  selectedSeats,
  onSeatsChange,
  flightNumber = "IX 2747",
  aircraft = "Airbus A320neo",
}: InteractiveSeatMapProps) {
  const [allSeats, setAllSeats] = useState<SeatData[]>(() => generateInitialSeats());
  const [inspectedSeat, setInspectedSeat] = useState<SeatData | null>(null);
  const [activePassengerIndex, setActivePassengerIndex] = useState<number>(0);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [liveRadarActive, setLiveRadarActive] = useState<boolean>(true);
  const [saveAsDefaultPref, setSaveAsDefaultPref] = useState<boolean>(true);
  const [userPref, setUserPref] = useState<FlightSeatPreference>(() => getSavedPreferences().flight);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    setUserPref(getSavedPreferences().flight);
  }, []);

  // Listen for real-time preferences updates
  useEffect(() => {
    const handlePrefUpdate = (e: any) => {
      if (e.detail?.flight) setUserPref(e.detail.flight);
    };
    window.addEventListener("mmt_preferences_updated", handlePrefUpdate);
    return () => window.removeEventListener("mmt_preferences_updated", handlePrefUpdate);
  }, []);

  // Real-time live seat availability simulation (pulsing real-time updates)
  useEffect(() => {
    if (!liveRadarActive) return;
    const interval = setInterval(() => {
      setAllSeats((prev) => {
        // Pick an unoccupied, unselected seat at random to toggle status
        const candidates = prev.filter(
          (s) => !selectedSeats.some((sel) => sel.id === s.id) && s.row > 8
        );
        if (!candidates.length) return prev;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        const nextStatus = target.status === "available" ? "reserved" : "available";
        return prev.map((s) => (s.id === target.id ? { ...s, status: nextStatus } : s));
      });
    }, 9000);
    return () => clearInterval(interval);
  }, [liveRadarActive, selectedSeats]);

  // Sync selected seats into map
  useEffect(() => {
    setAllSeats((prev) =>
      prev.map((s) => {
        const matchingSelected = selectedSeats.find((sel) => sel.id === s.id);
        if (matchingSelected) {
          return { ...s, status: "selected", passengerIndex: matchingSelected.passengerIndex };
        } else if (s.status === "selected") {
          return { ...s, status: "available", passengerIndex: undefined };
        }
        return s;
      })
    );
  }, [selectedSeats]);

  // Handle seat click
  const handleSeatClick = (seat: SeatData) => {
    if (seat.status === "occupied" || seat.status === "reserved") {
      setInspectedSeat(seat);
      return;
    }

    setInspectedSeat(seat);

    // If seat is already selected by current passenger, deselect it
    const existingIndex = selectedSeats.findIndex((s) => s.id === seat.id);
    let newSelected: SeatData[] = [];

    if (existingIndex >= 0) {
      newSelected = selectedSeats.filter((s) => s.id !== seat.id);
    } else {
      // If we already selected for current passenger, replace that passenger's seat
      const filtered = selectedSeats.filter((s) => s.passengerIndex !== activePassengerIndex);
      // Cap at ticket count
      if (filtered.length < ticketCount) {
        newSelected = [...filtered, { ...seat, passengerIndex: activePassengerIndex }];
        // Advance to next passenger if needed
        if (activePassengerIndex + 1 < ticketCount) {
          setActivePassengerIndex(activePassengerIndex + 1);
        }
      } else {
        newSelected = [...filtered.slice(0, ticketCount - 1), { ...seat, passengerIndex: activePassengerIndex }];
      }
    }

    const totalFees = newSelected.reduce((sum, s) => sum + s.price, 0);
    onSeatsChange(newSelected, totalFees);

    // If user wants to save preference
    if (saveAsDefaultPref) {
      savePreferences({
        flight: {
          preferredPosition: seat.position,
          preferredClass:
            seat.seatClass === "business"
              ? "Business"
              : seat.seatClass === "premium"
              ? "Premium Economy"
              : "Economy",
          extraLegroom: seat.seatClass === "exit-row" || seat.seatClass === "premium",
          forwardCabin: seat.row <= 10,
          quietZone: seat.row <= 6,
        },
      });
    }
  };

  // Smart Auto-Select based on saved preferences
  const handleAutoSelectPreferences = () => {
    const available = allSeats.filter((s) => s.status === "available");
    const matched: SeatData[] = [];

    for (let p = 0; p < ticketCount; p++) {
      // Find candidate matching preference
      let candidates = available.filter((s) => !matched.some((m) => m.id === s.id));

      // match position (window, aisle, etc)
      if (userPref.preferredPosition !== "any") {
        const posMatch = candidates.filter((c) => c.position === userPref.preferredPosition);
        if (posMatch.length) candidates = posMatch;
      }

      // match extra legroom if preferred
      if (userPref.extraLegroom) {
        const legMatch = candidates.filter((c) => c.seatClass === "exit-row" || c.seatClass === "premium");
        if (legMatch.length) candidates = legMatch;
      }

      // match forward cabin if preferred
      if (userPref.forwardCabin) {
        const forwardMatch = candidates.filter((c) => c.row <= 12);
        if (forwardMatch.length) candidates = forwardMatch;
      }

      const picked = candidates[0] || available[0];
      if (picked) {
        matched.push({ ...picked, passengerIndex: p });
      }
    }

    const totalFees = matched.reduce((sum, s) => sum + s.price, 0);
    onSeatsChange(matched, totalFees);
    setToastMessage(`Selected ${matched.length} seats matching your travel preference!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const totalSeatsFee = useMemo(() => {
    return selectedSeats.reduce((acc, s) => acc + s.price, 0);
  }, [selectedSeats]);

  return (
    <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-3xl p-5 sm:p-7 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DDD0] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-[#C2410C]/10 text-[#C2410C]">
              <Plane className="w-5 h-5 transform -rotate-45" />
            </span>
            <h3 className="text-xl font-black text-[#1E293B]">
              Interactive Seat Selection
            </h3>
            {liveRadarActive && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Seat Radar</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#786C60] mt-1">
            Choose your preferred seats for <strong className="text-[#1E293B]">{aircraft}</strong> • Flight {flightNumber}
          </p>
        </div>

        {/* Quick Preference Match CTA */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAutoSelectPreferences}
            className="border-[#C2410C] text-[#C2410C] hover:bg-[#C2410C]/10 rounded-xl text-xs font-bold flex items-center space-x-1.5 h-9"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Auto-Match My Preference</span>
          </Button>
          <button
            type="button"
            onClick={() => setLiveRadarActive(!liveRadarActive)}
            title="Toggle live availability sync"
            className="p-2 rounded-xl border border-[#E6DDD0] bg-[#FAF6EF] text-[#786C60] hover:text-[#1E293B] hover:border-[#D48B68] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${liveRadarActive ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Passenger Tabs for Multi-Seat Booking */}
      <div className="mt-5 bg-[#FAF6EF] p-3 rounded-2xl border border-[#E6DDD0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-xs font-bold text-[#57534E] flex items-center space-x-1 mr-1">
            <Users className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Passenger:</span>
          </span>
          {Array.from({ length: ticketCount }).map((_, idx) => {
            const assigned = selectedSeats.find((s) => s.passengerIndex === idx);
            const isActive = activePassengerIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePassengerIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? "bg-[#1E293B] text-white shadow-sm ring-2 ring-[#C2410C]/40"
                    : "bg-white text-[#57534E] border border-[#E6DDD0] hover:border-[#D48B68]"
                }`}
              >
                <span>Passenger {idx + 1}</span>
                {assigned ? (
                  <span className="bg-[#C2410C] text-white px-1.5 py-0.5 rounded text-[10px] font-black">
                    {assigned.id}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-normal">Unassigned</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Seats summary badge */}
        <div className="text-xs font-bold text-[#1E293B] flex items-center space-x-2">
          <span className="text-[#786C60]">Selected Seat Fees:</span>
          <span className="text-sm font-black text-[#C2410C]">
            + ₹ {totalSeatsFee.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Seat Tier Upselling Badges & Legend */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Business */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/60 border border-indigo-200/80 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-indigo-900 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Business Pod
            </span>
            <span className="text-xs font-black text-indigo-700">+₹3,200</span>
          </div>
          <p className="text-[10px] text-indigo-600/90 leading-tight">
            Lie-flat bed, chef meals, lounge access &amp; priority baggage.
          </p>
        </div>

        {/* Exit Row Legroom */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Extra Legroom
            </span>
            <span className="text-xs font-black text-amber-700">+₹850</span>
          </div>
          <p className="text-[10px] text-amber-700/90 leading-tight">
            Emergency exit row, +6 inches space to stretch out.
          </p>
        </div>

        {/* Preferred Front / Window */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50/60 border border-blue-200/80 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-blue-900 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              Preferred Seat
            </span>
            <span className="text-xs font-black text-blue-700">+₹350</span>
          </div>
          <p className="text-[10px] text-blue-700/90 leading-tight">
            Window or Aisle in forward cabin for early deplaning.
          </p>
        </div>

        {/* Standard Economy */}
        <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-stone-800 flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5 text-stone-500" />
              Standard Seat
            </span>
            <span className="text-xs font-black text-emerald-600">Free / ₹0</span>
          </div>
          <p className="text-[10px] text-stone-500 leading-tight">
            Comfortable standard seating with ergonomic headrest.
          </p>
        </div>
      </div>

      {/* Main Seat Map Grid & Fuselage visualization */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Airplane Fuselage Section */}
        <div className="lg:col-span-8 bg-[#FAF6EF] border border-[#E6DDD0] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-inner">
          {/* Airplane Nose & Cockpit Graphic */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-32 h-14 bg-gradient-to-b from-[#1E293B] to-[#334155] rounded-t-full flex flex-col items-center justify-center text-white border-t-2 border-x-2 border-[#64748B] shadow-md">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Cockpit
              </span>
              <div className="w-16 h-2 bg-sky-300/40 rounded-full mt-1" />
            </div>
            <div className="w-full h-1 bg-[#E6DDD0] my-2" />
            <div className="flex justify-between w-full max-w-xs text-[10px] font-bold text-[#786C60] px-4">
              <span>Galley / Lavatory 🚻</span>
              <span>Forward Exit Doors 🚪</span>
            </div>
          </div>

          {/* Seat Layout Columns Header */}
          <div className="max-w-md mx-auto grid grid-cols-7 text-center text-xs font-black text-[#57534E] mb-3 px-2">
            <span>A (Win)</span>
            <span>B (Mid)</span>
            <span>C (Ais)</span>
            <span className="text-[#C2410C] font-mono">Row</span>
            <span>D (Ais)</span>
            <span>E (Mid)</span>
            <span>F (Win)</span>
          </div>

          {/* Fuselage Cabin Container */}
          <div className="max-w-md mx-auto space-y-2 py-1">
            {/* Section 1: Business Class */}
            <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 mb-4">
              <div className="text-[11px] font-black text-indigo-900 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Business Class Cabin (180° Lie-Flat Pods)</span>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((rowNum) => {
                  const rowSeats = allSeats.filter((s) => s.row === rowNum);
                  const seatA = rowSeats.find((s) => s.col === "A");
                  const seatC = rowSeats.find((s) => s.col === "C");
                  const seatD = rowSeats.find((s) => s.col === "D");
                  const seatF = rowSeats.find((s) => s.col === "F");

                  return (
                    <div key={rowNum} className="grid grid-cols-7 gap-2 items-center text-center">
                      {/* Seat A */}
                      <SeatButton seat={seatA} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      <div className="h-6 flex items-center justify-center text-[10px] text-stone-300">
                        —
                      </div>
                      {/* Seat C */}
                      <SeatButton seat={seatC} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      {/* Row Indicator */}
                      <span className="text-xs font-mono font-bold text-indigo-800">{rowNum}</span>
                      {/* Seat D */}
                      <SeatButton seat={seatD} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      <div className="h-6 flex items-center justify-center text-[10px] text-stone-300">
                        —
                      </div>
                      {/* Seat F */}
                      <SeatButton seat={seatF} onClick={handleSeatClick} onHover={setInspectedSeat} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cabin Divider */}
            <div className="flex items-center justify-center my-3 gap-2">
              <div className="h-px bg-stone-300 flex-1" />
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-stone-100 px-3 py-0.5 rounded-full border border-stone-200">
                Curtain / Lavatory
              </span>
              <div className="h-px bg-stone-300 flex-1" />
            </div>

            {/* Section 2: Economy Rows */}
            {Array.from(new Set(allSeats.filter((s) => s.row >= 4).map((s) => s.row)))
              .sort((a, b) => a - b)
              .map((rowNum) => {
                const rowSeats = allSeats.filter((s) => s.row === rowNum);
                const seatA = rowSeats.find((s) => s.col === "A");
                const seatB = rowSeats.find((s) => s.col === "B");
                const seatC = rowSeats.find((s) => s.col === "C");
                const seatD = rowSeats.find((s) => s.col === "D");
                const seatE = rowSeats.find((s) => s.col === "E");
                const seatF = rowSeats.find((s) => s.col === "F");
                const isExitRow = rowNum === 12 || rowNum === 13;

                return (
                  <React.Fragment key={rowNum}>
                    {isExitRow && rowNum === 12 && (
                      <div className="py-2 flex items-center justify-between text-[10px] font-bold text-amber-800 bg-amber-100/70 px-3 rounded-xl border border-amber-300 my-2">
                        <span>🚪 EMERGENCY EXIT</span>
                        <span>EXTRA LEGROOM (+6 INCHES)</span>
                        <span>EMERGENCY EXIT 🚪</span>
                      </div>
                    )}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 items-center text-center">
                      <SeatButton seat={seatA} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      <SeatButton seat={seatB} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      <SeatButton seat={seatC} onClick={handleSeatClick} onHover={setInspectedSeat} />

                      {/* Row Label */}
                      <span
                        className={`text-xs font-mono font-bold ${
                          isExitRow ? "text-amber-700 bg-amber-200/50 py-1 rounded" : "text-stone-500"
                        }`}
                      >
                        {rowNum}
                      </span>

                      <SeatButton seat={seatD} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      <SeatButton seat={seatE} onClick={handleSeatClick} onHover={setInspectedSeat} />
                      <SeatButton seat={seatF} onClick={handleSeatClick} onHover={setInspectedSeat} />
                    </div>
                  </React.Fragment>
                );
              })}
          </div>

          {/* Aircraft Tail graphic */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="w-24 h-8 bg-[#334155] rounded-b-3xl flex items-center justify-center text-white text-[9px] font-bold">
              Aft Galley
            </div>
            <div className="w-48 h-3 bg-gradient-to-r from-transparent via-[#C2410C] to-transparent rounded-full mt-2 opacity-60" />
          </div>
        </div>

        {/* Right Column: Seat Details Inspector & Saved Preferences */}
        <div className="lg:col-span-4 space-y-4">
          {/* Inspected Seat Detail Card */}
          <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <Armchair className="w-4 h-4 text-[#C2410C]" />
                <h4 className="text-sm font-black text-[#1E293B]">
                  {inspectedSeat ? `Seat ${inspectedSeat.id}` : "Seat Inspector"}
                </h4>
              </div>
              {inspectedSeat && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    inspectedSeat.status === "available"
                      ? "bg-emerald-100 text-emerald-800"
                      : inspectedSeat.status === "selected"
                      ? "bg-indigo-100 text-indigo-800"
                      : inspectedSeat.status === "reserved"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {inspectedSeat.status}
                </span>
              )}
            </div>

            {inspectedSeat ? (
              <div className="space-y-2.5 text-xs text-[#57534E]">
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="font-bold text-[#1E293B] capitalize">
                    {inspectedSeat.seatClass === "exit-row" ? "Extra Legroom (Exit)" : inspectedSeat.seatClass}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="font-bold text-[#1E293B] capitalize">
                    {inspectedSeat.position} Seat
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Seat Pitch:</span>
                  <span className="font-bold text-[#1E293B]">{inspectedSeat.pitch}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recline:</span>
                  <span className="font-bold text-[#1E293B]">{inspectedSeat.recline}</span>
                </div>
                <div className="flex justify-between">
                  <span>Power Outlet:</span>
                  <span className="font-bold text-[#1E293B]">
                    {inspectedSeat.hasPower ? "AC & USB-C Ports" : "USB in galley"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#E6DDD0] pt-2">
                  <span className="font-bold text-[#1E293B]">Tariff Upgrade:</span>
                  <span className="font-black text-sm text-[#C2410C]">
                    {inspectedSeat.price === 0 ? "Complimentary" : `+ ₹ ${inspectedSeat.price.toLocaleString("en-IN")}`}
                  </span>
                </div>

                {inspectedSeat.status === "available" && (
                  <Button
                    type="button"
                    onClick={() => handleSeatClick(inspectedSeat)}
                    className="w-full mt-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs py-2 rounded-xl"
                  >
                    Select Seat {inspectedSeat.id} for Passenger {activePassengerIndex + 1}
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#786C60] space-y-2">
                <Armchair className="w-8 h-8 text-stone-300 mx-auto" />
                <p>Hover or click any seat in the dynamic cabin to inspect pitch, recline, and tariff upgrade.</p>
              </div>
            )}
          </div>

          {/* Passenger Assignment Summary Card */}
          <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Assigned Seats ({selectedSeats.length}/{ticketCount})</span>
            </h4>

            {selectedSeats.length > 0 ? (
              <div className="space-y-2">
                {selectedSeats.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#FAF6EF] p-2.5 rounded-xl border border-[#E6DDD0] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-sm text-[#1E293B]">{s.id}</span>
                        <span className="text-[10px] text-stone-500 capitalize">({s.position})</span>
                      </div>
                      <span className="text-[10px] text-[#786C60]">
                        Passenger {(s.passengerIndex ?? 0) + 1} • {s.seatClass}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-[#C2410C]">
                        {s.price === 0 ? "Free" : `+₹${s.price}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">No seats selected yet. Please pick {ticketCount} seat{ticketCount > 1 ? "s" : ""}.</p>
            )}
          </div>

          {/* Saved Travel Preferences Option */}
          <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4 space-y-3">
            <div className="flex items-start space-x-2">
              <BookmarkCheck className="w-4 h-4 text-[#C2410C] mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-[#1E293B]">Personalized Flight Preferences</h5>
                <p className="text-[11px] text-[#786C60] mt-0.5">
                  Current: <strong className="capitalize text-[#1E293B]">{userPref.preferredPosition}</strong> seat,{" "}
                  {userPref.extraLegroom ? "Extra Legroom" : "Standard"}.
                </p>
              </div>
            </div>

            <label className="flex items-center space-x-2 text-xs text-[#57534E] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={saveAsDefaultPref}
                onChange={(e) => setSaveAsDefaultPref(e.target.checked)}
                className="rounded border-[#E6DDD0] text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span>Remember this seat style for my future bookings</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Seat Button Subcomponent with intuitive interactive styling
interface SeatButtonProps {
  seat?: SeatData;
  onClick: (seat: SeatData) => void;
  onHover: (seat: SeatData) => void;
}

function SeatButton({ seat, onClick, onHover }: SeatButtonProps) {
  if (!seat) {
    return <div className="w-8 h-8 sm:w-9 sm:h-9" />;
  }

  const isOcc = seat.status === "occupied";
  const isRes = seat.status === "reserved";
  const isSel = seat.status === "selected";
  const isBusiness = seat.seatClass === "business";
  const isExit = seat.seatClass === "exit-row";
  const isPremium = seat.seatClass === "premium";

  // Class colors
  let colorClasses = "bg-white text-stone-800 border-stone-300 hover:border-[#C2410C] hover:bg-stone-50";

  if (isBusiness) {
    colorClasses = "bg-indigo-50/80 text-indigo-950 border-indigo-300 hover:border-indigo-600 hover:bg-indigo-100";
  } else if (isExit) {
    colorClasses = "bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-600 hover:bg-amber-100";
  } else if (isPremium) {
    colorClasses = "bg-blue-50 text-blue-950 border-blue-300 hover:border-blue-600 hover:bg-blue-100";
  }

  if (isSel) {
    colorClasses = "bg-[#C2410C] text-white border-[#9A3412] shadow-md ring-2 ring-[#C2410C]/50 scale-105";
  } else if (isOcc) {
    colorClasses = "bg-stone-300/80 text-stone-500 border-stone-300 cursor-not-allowed opacity-60";
  } else if (isRes) {
    colorClasses = "bg-amber-200/70 text-amber-900 border-amber-300 cursor-not-allowed opacity-80 animate-pulse";
  }

  return (
    <button
      type="button"
      disabled={isOcc || isRes}
      onClick={() => onClick(seat)}
      onMouseEnter={() => onHover(seat)}
      title={`Seat ${seat.id} (${seat.seatClass}, ${seat.position}): ${seat.price === 0 ? "Free" : `+₹${seat.price}`}`}
      className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-[11px] font-bold flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${colorClasses}`}
    >
      <span>{seat.col}</span>
      {isSel && (
        <span className="absolute -top-1.5 -right-1.5 bg-[#1E293B] text-white w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-bold">
          {(seat.passengerIndex ?? 0) + 1}
        </span>
      )}
      {seat.price > 0 && !isOcc && !isSel && (
        <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
      )}
    </button>
  );
}
