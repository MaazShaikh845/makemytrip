// components/Hotel/Hotel.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Hotel as HotelIcon, MapPin, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gethotels } from "@/lib/api";

export default function HotelList({
  onSelect,
}: {
  onSelect: (hotel: any) => void;
}) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await gethotels();
        setHotels(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Unable to load hotels.");
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
          <HotelIcon className="w-4 h-4 text-[#C2410C] animate-pulse" />
          <span>Fetching database hotels…</span>
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
          <HotelIcon className="w-4 h-4 text-[#BE123C]" />
          <span>Available Hotels</span>
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
        <HotelIcon className="w-4 h-4 text-[#C2410C]" />
        <span>Database Hotel Inventory ({hotels.length})</span>
      </h3>

      {hotels.length === 0 ? (
        <p className="text-[#786C60] text-xs">No hotels found in database.</p>
      ) : (
        <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="p-3.5 bg-[#FFFDF9] border border-[#E6DDD0] rounded-xl hover:border-[#D48B68] transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E293B] text-sm">
                    {hotel.name}
                  </span>
                  <span className="text-[#C2410C] font-black text-sm">
                    ₹{hotel.pricePerNight?.toLocaleString("en-IN")}/night
                  </span>
                </div>

                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < (hotel.starRating ?? 0)
                          ? "text-amber-500 fill-amber-500"
                          : "text-stone-300"
                      }`}
                    />
                  ))}
                  <span className="text-[11px] text-[#786C60] ml-1.5 font-medium">
                    {hotel.city}
                  </span>
                </div>

                <p className="text-xs text-[#57534E] mt-1 line-clamp-1">
                  {hotel.address}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-[#786C60] mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#047857]" />
                    {hotel.availableRooms} rooms available
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E6DDD0] flex justify-end">
                <Button
                  size="sm"
                  onClick={() => onSelect(hotel)}
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
