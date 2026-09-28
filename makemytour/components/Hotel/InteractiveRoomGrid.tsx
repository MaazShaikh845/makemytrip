"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bed,
  Sparkles,
  Maximize2,
  Users,
  Eye,
  Check,
  Zap,
  Award,
  Crown,
  BookmarkCheck,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HotelRoom3DPreviewModal from "./HotelRoom3DPreviewModal";
import {
  getSavedPreferences,
  savePreferences,
  HotelRoomPreference,
} from "@/lib/preferences";

export interface HotelRoomType {
  id: string;
  name: string;
  tier: "standard" | "deluxe" | "suite" | "penthouse";
  tag?: string;
  tagColor?: string;
  sizeSqFt: number;
  sizeM2: number;
  bedType: "King Bed" | "Twin Beds" | "Queen Bed";
  maxGuests: number;
  viewType: "City View" | "Ocean View" | "Garden View" | "Pool View";
  floorLevel: "High Floor" | "Low Floor" | "Any";
  pricePerNight: number;
  priceDifference: number; // relative to standard
  originalPrice: number;
  availableInventory: number;
  urgencyText?: string;
  images: string[];
  perks: string[];
  amenities: string[];
}

interface InteractiveRoomGridProps {
  basePrice: number;
  hotelName: string;
  hotelId: string;
  selectedRoom: HotelRoomType | null;
  onSelectRoom: (room: HotelRoomType) => void;
}

// Generate tiered room types dynamically anchored around base price
export function generateHotelRoomTypes(basePrice: number, hotelId: string): HotelRoomType[] {
  const safeBase = Math.max(1500, basePrice || 3200);

  return [
    {
      id: "std-cozy",
      name: "Standard Deluxe Room",
      tier: "standard",
      sizeSqFt: 285,
      sizeM2: 26,
      bedType: "Queen Bed",
      maxGuests: 2,
      viewType: "Garden View",
      floorLevel: "Low Floor",
      pricePerNight: safeBase,
      priceDifference: 0,
      originalPrice: Math.round(safeBase * 1.15),
      availableInventory: 5,
      urgencyText: "Standard Rate",
      images: [
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
      ],
      perks: [
        "High-Speed Wi-Fi Included",
        "Complimentary Tea & Coffee Maker",
        "Soundproof double glazing",
      ],
      amenities: ["Wi-Fi", "Air Conditioning", "Rain Shower", "Work Desk", "LED TV"],
    },
    {
      id: "dlx-king",
      name: "Deluxe King Panoramic Suite",
      tier: "deluxe",
      tag: "MOST POPULAR",
      tagColor: "bg-blue-600 text-white",
      sizeSqFt: 395,
      sizeM2: 37,
      bedType: "King Bed",
      maxGuests: 3,
      viewType: "City View",
      floorLevel: "High Floor",
      pricePerNight: safeBase + 1150,
      priceDifference: 1150,
      originalPrice: Math.round((safeBase + 1150) * 1.25),
      availableInventory: 3,
      urgencyText: "⚡ Only 3 left at 25% OFF",
      images: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        "https://images.unsplash.com/photo-1560185127-6a8e7bbc4946?w=800",
      ],
      perks: [
        "Complimentary Buffet Breakfast for 2",
        "Floor-to-Ceiling Skyline Windows",
        "Italian Marble Bath & Rain Shower",
        "Late Checkout up to 2:00 PM",
      ],
      amenities: ["Wi-Fi", "Free Breakfast", "Mini-bar", "Balcony", "Smart 4K TV", "Coffee Machine"],
    },
    {
      id: "exec-club",
      name: "Executive Club High-Floor Suite",
      tier: "suite",
      tag: "BEST UPGRADE VALUE",
      tagColor: "bg-amber-600 text-white",
      sizeSqFt: 580,
      sizeM2: 54,
      bedType: "King Bed",
      maxGuests: 3,
      viewType: "Ocean View",
      floorLevel: "High Floor",
      pricePerNight: safeBase + 2750,
      priceDifference: 2750,
      originalPrice: Math.round((safeBase + 2750) * 1.3),
      availableInventory: 2,
      urgencyText: "🔥 High Demand: 9 bookings today",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
        "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800",
        "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=800",
      ],
      perks: [
        "VIP Executive Lounge Access & Daily Cocktails",
        "Deep Soaking Designer Bathtub",
        "Priority Early Check-in from 10:00 AM",
        "Complimentary One-Way Airport Transfer",
      ],
      amenities: ["Club Access", "Airport Shuttle", "Bathtub", "Free Cocktails", "Espresso Bar", "King Bed"],
    },
    {
      id: "pres-villa",
      name: "Royal Presidential Penthouse Villa",
      tier: "penthouse",
      tag: "VIP LUXURY",
      tagColor: "bg-purple-600 text-white",
      sizeSqFt: 980,
      sizeM2: 91,
      bedType: "King Bed",
      maxGuests: 4,
      viewType: "Ocean View",
      floorLevel: "High Floor",
      pricePerNight: safeBase + 6400,
      priceDifference: 6400,
      originalPrice: Math.round((safeBase + 6400) * 1.35),
      availableInventory: 1,
      urgencyText: "💎 Only 1 Presidential Suite available",
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
      ],
      perks: [
        "24/7 Dedicated Private Butler",
        "Private Open-Air Terrace Jacuzzi",
        "Complimentary Moët & Chandon Champagne",
        "Round-trip Luxury Chauffeur Service",
      ],
      amenities: ["Private Jacuzzi", "Dedicated Butler", "Champagne", "360 Balcony", "Walk-in Wardrobe"],
    },
  ];
}

export default function InteractiveRoomGrid({
  basePrice,
  hotelName,
  hotelId,
  selectedRoom,
  onSelectRoom,
}: InteractiveRoomGridProps) {
  const roomTypes = useMemo(() => generateHotelRoomTypes(basePrice, hotelId), [basePrice, hotelId]);

  const [previewRoom, setPreviewRoom] = useState<HotelRoomType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userPref, setUserPref] = useState<HotelRoomPreference>(() => getSavedPreferences().hotel);
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [matchToast, setMatchToast] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    setUserPref(getSavedPreferences().hotel);
  }, []);

  // Listen to preference changes
  useEffect(() => {
    const handlePrefUpdate = (e: any) => {
      if (e.detail?.hotel) setUserPref(e.detail.hotel);
    };
    window.addEventListener("mmt_preferences_updated", handlePrefUpdate);
    return () => window.removeEventListener("mmt_preferences_updated", handlePrefUpdate);
  }, []);

  // Check which room matches user's saved preferences
  const isBestMatch = (room: HotelRoomType) => {
    return (
      room.bedType === userPref.bedType &&
      (userPref.floorLevel === "Any" || room.floorLevel === userPref.floorLevel)
    );
  };

  const handleSelect = (room: HotelRoomType) => {
    onSelectRoom(room);
    if (saveAsDefault) {
      savePreferences({
        hotel: {
          bedType: room.bedType,
          floorLevel: room.floorLevel,
          viewType: room.viewType,
          smoking: false,
          workDesk: true,
          balcony: room.tier !== "standard",
          quietRoom: true,
        },
      });
    }
  };

  const handleAutoSelectPreference = () => {
    const matched = roomTypes.find((r) => isBestMatch(r)) || roomTypes[1] || roomTypes[0];
    onSelectRoom(matched);
    setMatchToast(`Selected ${matched.name} based on your saved stay preferences!`);
    setTimeout(() => setMatchToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFDF9] border border-[#E6DDD0] p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Bed className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-[#1E293B]">
              Select Your Room Category
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Real-time Availability
            </span>
          </div>
          <p className="text-xs text-[#786C60] mt-1">
            Compare room dimensions, upgrades, and experience in interactive 3D before you book.
          </p>
        </div>

        {/* Preference Match Button */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAutoSelectPreference}
            className="border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl text-xs font-bold flex items-center space-x-1.5 h-9"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Auto-Match My Room Preferences</span>
          </Button>
        </div>
      </div>

      {matchToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{matchToast}</span>
        </div>
      )}

      {/* Room Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roomTypes.map((room) => {
          const isSelected = selectedRoom?.id === room.id;
          const matchesPref = isBestMatch(room);

          return (
            <div
              key={room.id}
              className={`relative bg-[#FFFDF9] rounded-3xl border-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? "border-[#2563EB] ring-2 ring-[#2563EB]/30 bg-blue-50/20"
                  : "border-[#E6DDD0] hover:border-[#D48B68]"
              }`}
            >
              {/* Top Banner Tag / Upsell / Preference Badge */}
              <div className="relative h-52 sm:h-56 overflow-hidden group">
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badges on Image */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {room.tag && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${room.tagColor}`}
                    >
                      {room.tag}
                    </span>
                  )}
                  {matchesPref && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Matches Your Preference
                    </span>
                  )}
                </div>

                {/* 3D Preview Floating Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRoom(room);
                    setModalOpen(true);
                  }}
                  className="absolute bottom-3 right-3 bg-[#1E293B]/85 hover:bg-[#1E293B] text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive 3D Tour</span>
                </button>

                {/* Dimension & Guest Pill */}
                <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center space-x-2">
                  <span>{room.sizeSqFt} sq.ft</span>
                  <span>•</span>
                  <span>{room.bedType}</span>
                </div>
              </div>

              {/* Room Details Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#1E293B] leading-snug">
                        {room.name}
                      </h3>
                      <p className="text-xs text-[#786C60] mt-0.5">
                        {room.viewType} • Level: {room.floorLevel} • Fits {room.maxGuests} Adults
                      </p>
                    </div>

                    {room.urgencyText && (
                      <span className="text-[10px] font-bold text-[#C2410C] bg-[#C2410C]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {room.urgencyText}
                      </span>
                    )}
                  </div>

                  {/* Highlights / Perks List */}
                  <div className="mt-3.5 space-y-1.5">
                    {room.perks.map((perk, i) => (
                      <div key={i} className="flex items-center space-x-2 text-xs text-[#57534E]">
                        <Check className="w-3.5 h-3.5 text-[#047857] flex-shrink-0" />
                        <span className="font-medium">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & Selection Footer */}
                <div className="pt-3 border-t border-[#E6DDD0]">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <span className="text-xs text-[#786C60] line-through block">
                        ₹ {room.originalPrice.toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-xl sm:text-2xl font-black text-[#1E293B]">
                          ₹ {room.pricePerNight.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-[#786C60]">/ night</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {room.priceDifference === 0 ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Base Inclusion
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-[#786C60] block font-medium">Upgrade Tariff</span>
                          <span className="text-xs font-black text-[#C2410C]">
                            + ₹{room.priceDifference.toLocaleString("en-IN")} / night
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPreviewRoom(room);
                        setModalOpen(true);
                      }}
                      className="border-[#E6DDD0] text-[#1E293B] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl h-10 flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C2410C]" />
                      <span>3D Preview</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleSelect(room)}
                      className={`text-xs font-black rounded-xl h-10 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm"
                          : "bg-[#1E293B] text-white hover:bg-[#0F172A]"
                      }`}
                    >
                      {isSelected ? "Selected Room ✓" : "Select Room"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Room Preferences notice */}
      <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <BookmarkCheck className="w-4 h-4 text-[#C2410C] flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-[#1E293B]">Personalized Room Preferences: </span>
            <span className="text-[#786C60]">
              {userPref.bedType} • {userPref.floorLevel} • {userPref.viewType}
            </span>
          </div>
        </div>

        <label className="flex items-center space-x-2 text-xs text-[#57534E] cursor-pointer">
          <input
            type="checkbox"
            checked={saveAsDefault}
            onChange={(e) => setSaveAsDefault(e.target.checked)}
            className="rounded border-[#E6DDD0] text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span>Remember chosen room style as my stay preference</span>
        </label>
      </div>

      {/* 3D Preview Modal */}
      <HotelRoom3DPreviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        room={previewRoom}
        hotelName={hotelName}
        onSelectRoom={handleSelect}
      />
    </div>
  );
}
