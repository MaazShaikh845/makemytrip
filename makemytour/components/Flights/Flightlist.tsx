// components/Flights/Flightlist.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Plane, Calendar, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getflights } from "@/lib/api";

export default function FlightList({
  onSelect,
}: {
  onSelect: (flight: any) => void;
}) {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getflights();
        setFlights(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Unable to load flights.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1E293B] mb-2 flex items-center space-x-2">
          <Plane className="w-4 h-4 text-[#C2410C] animate-pulse" />
          <span>Fetching database flights…</span>
        </h3>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-[#FAF6EF] border border-[#E6DDD0] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#1E293B] mb-2 flex items-center space-x-2">
          <Plane className="w-4 h-4 text-[#BE123C]" />
          <span>Available Database Flights</span>
        </h3>
        <div className="p-3 bg-[#BE123C]/10 border border-[#BE123C]/30 rounded-xl text-[#BE123C] text-xs font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#1E293B] mb-2 flex items-center space-x-2">
        <Plane className="w-4 h-4 text-[#C2410C]" />
        <span>Database Carrier Inventory ({flights.length})</span>
      </h3>

      {flights.length === 0 ? (
        <p className="text-[#786C60] text-xs">No flights found in database.</p>
      ) : (
        <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
          {flights.map((flight) => (
            <div
              key={flight.id}
              className="p-3.5 bg-[#FFFDF9] border border-[#E6DDD0] rounded-xl hover:border-[#D48B68] transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B] text-sm">
                    {flight.airline}{" "}
                    <span className="text-[#C2410C] font-mono text-xs">
                      {flight.flightNumber}
                    </span>
                  </span>
                  <span className="text-[#C2410C] font-black text-sm">
                    ₹{flight.price?.toLocaleString("en-IN")}
                  </span>
                </div>

                <p className="text-xs text-[#57534E] mt-1 font-bold">
                  {flight.origin} → {flight.destination}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#786C60] mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#D97706]" />
                    {flight.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#047857]" />
                    {flight.availableSeats} seats
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF6EF] border border-[#E6DDD0] text-[10px] uppercase font-bold text-[#1E293B]">
                    {flight.classType}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E6DDD0] flex justify-end">
                <Button
                  size="sm"
                  onClick={() => onSelect(flight)}
                  className="bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold py-1 px-3 rounded-lg"
                >
                  Edit Record
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
