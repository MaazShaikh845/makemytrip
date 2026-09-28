"use client";

import React, { useState, useEffect } from "react";
import {
  Armchair,
  Bed,
  Check,
  Sparkles,
  Compass,
  Zap,
  Building,
  Eye,
  BookmarkCheck,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getSavedPreferences,
  savePreferences,
  UserTravelPreferences,
} from "@/lib/preferences";

export default function TravelPreferencesCard() {
  const [activeTab, setActiveTab] = useState<"flight" | "hotel">("flight");
  const [prefs, setPrefs] = useState<UserTravelPreferences>(() => getSavedPreferences());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setPrefs(getSavedPreferences());
  }, []);

  const handleFlightChange = (key: keyof UserTravelPreferences["flight"], value: any) => {
    setPrefs((prev) => ({
      ...prev,
      flight: { ...prev.flight, [key]: value },
    }));
  };

  const handleHotelChange = (key: keyof UserTravelPreferences["hotel"], value: any) => {
    setPrefs((prev) => ({
      ...prev,
      hotel: { ...prev.hotel, [key]: value },
    }));
  };

  const handleSave = () => {
    savePreferences(prefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/80 space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2">
          <BookmarkCheck className="w-5 h-5 text-[#C2410C]" />
          <h3 className="text-base font-bold text-stone-900">
            Travel &amp; Stay Preferences
          </h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#C2410C] px-2.5 py-0.5 rounded-full border border-orange-200">
          Personalized
        </span>
      </div>

      <p className="text-xs text-stone-500 leading-relaxed">
        Save your preferred flight seats and hotel room configurations to automatically personalize future bookings.
      </p>

      {/* Tabs */}
      <div className="flex items-center space-x-1.5 bg-stone-100/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("flight")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === "flight"
              ? "bg-white text-[#1E293B] shadow-xs"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Armchair className="w-3.5 h-3.5 text-[#C2410C]" />
          <span>Flight Seats</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("hotel")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === "hotel"
              ? "bg-white text-[#1E293B] shadow-xs"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <Bed className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Hotel Rooms</span>
        </button>
      </div>

      {/* Flight Preferences */}
      {activeTab === "flight" && (
        <div className="space-y-4 pt-1">
          {/* Seat Position */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Preferred Seat Position
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {(["window", "aisle", "middle", "any"] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => handleFlightChange("preferredPosition", pos)}
                  className={`py-1.5 rounded-lg font-bold capitalize transition-all border text-center cursor-pointer ${
                    prefs.flight.preferredPosition === pos
                      ? "bg-[#1E293B] text-white border-[#1E293B]"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Cabin Class Preference */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Cabin Class
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(["Economy", "Premium Economy", "Business"] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleFlightChange("preferredClass", cls)}
                  className={`py-1.5 px-1 rounded-lg font-bold transition-all border text-center cursor-pointer truncate ${
                    prefs.flight.preferredClass === cls
                      ? "bg-[#C2410C] text-white border-[#C2410C]"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Boolean Feature Toggles */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.flight.extraLegroom}
                onChange={(e) => handleFlightChange("extraLegroom", e.target.checked)}
                className="rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span>Prefer Extra Legroom / Exit Row Seats</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.flight.forwardCabin}
                onChange={(e) => handleFlightChange("forwardCabin", e.target.checked)}
                className="rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span>Prefer Forward Cabin for Quick Deplaning</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.flight.quietZone}
                onChange={(e) => handleFlightChange("quietZone", e.target.checked)}
                className="rounded border-stone-300 text-[#C2410C] focus:ring-[#C2410C]"
              />
              <span>Quiet Zone Seating (Away from Galleys)</span>
            </label>
          </div>
        </div>
      )}

      {/* Hotel Preferences */}
      {activeTab === "hotel" && (
        <div className="space-y-4 pt-1">
          {/* Bed Type */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Preferred Bed Configuration
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(["King Bed", "Queen Bed", "Twin Beds"] as const).map((bed) => (
                <button
                  key={bed}
                  type="button"
                  onClick={() => handleHotelChange("bedType", bed)}
                  className={`py-1.5 rounded-lg font-bold transition-all border text-center cursor-pointer ${
                    prefs.hotel.bedType === bed
                      ? "bg-[#2563EB] text-white border-[#2563EB]"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {bed}
                </button>
              ))}
            </div>
          </div>

          {/* Floor Level */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              Floor Preference
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(["High Floor", "Low Floor", "Any"] as const).map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => handleHotelChange("floorLevel", fl)}
                  className={`py-1.5 rounded-lg font-bold transition-all border text-center cursor-pointer ${
                    prefs.hotel.floorLevel === fl
                      ? "bg-[#1E293B] text-white border-[#1E293B]"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {fl}
                </button>
              ))}
            </div>
          </div>

          {/* View Preference */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              View Preference
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(["City View", "Ocean View", "Garden View", "Pool View"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => handleHotelChange("viewType", view)}
                  className={`py-1.5 rounded-lg font-bold transition-all border text-center cursor-pointer ${
                    prefs.hotel.viewType === view
                      ? "bg-[#1E293B] text-white border-[#1E293B]"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Boolean Feature Toggles */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.hotel.workDesk}
                onChange={(e) => handleHotelChange("workDesk", e.target.checked)}
                className="rounded border-stone-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Dedicated Work Desk &amp; High-Speed WiFi</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.hotel.balcony}
                onChange={(e) => handleHotelChange("balcony", e.target.checked)}
                className="rounded border-stone-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Room with Private Balcony or Terrace</span>
            </label>

            <label className="flex items-center space-x-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.hotel.quietRoom}
                onChange={(e) => handleHotelChange("quietRoom", e.target.checked)}
                className="rounded border-stone-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>Quiet Room (Away from Elevators)</span>
            </label>
          </div>
        </div>
      )}

      {/* Save Button & Feedback */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#1E293B] hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Preferences Saved Successfully!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Travel Preferences</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
