"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  Sun,
  Moon,
  Sunset,
  Sparkles,
  Bed,
  Bath,
  Compass,
  Check,
  Eye,
  Layers,
  Info,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Coffee,
  Tv,
} from "lucide-react";
import { HotelRoomType } from "./InteractiveRoomGrid";

interface HotelRoom3DPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: HotelRoomType | null;
  hotelName: string;
  onSelectRoom?: (room: HotelRoomType) => void;
}

export default function HotelRoom3DPreviewModal({
  open,
  onOpenChange,
  room,
  hotelName,
  onSelectRoom,
}: HotelRoom3DPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"3d" | "photos" | "floorplan">("3d");
  const [lightingMode, setLightingMode] = useState<"day" | "sunset" | "night">("day");
  const [activeHotspot, setActiveHotspot] = useState<string | null>("bed");
  const [photoIndex, setPhotoIndex] = useState(0);

  // 3D rotation state
  const [rotation, setRotation] = useState({ x: 10, y: -20 });
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  if (!room) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      x: Math.max(-25, Math.min(25, prev.x - deltaY * 0.4)),
      y: (prev.y + deltaX * 0.5) % 360,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const lightingStyles = {
    day: {
      bg: "from-sky-100/90 via-amber-50/40 to-stone-100",
      ambient: "brightness-105 contrast-100 saturate-105",
      roomGlow: "shadow-[0_0_80px_rgba(255,240,200,0.5)]",
      windowLight: "bg-gradient-to-t from-sky-200/60 to-amber-100/80",
    },
    sunset: {
      bg: "from-amber-200/60 via-rose-100/50 to-orange-200/40",
      ambient: "brightness-95 contrast-110 saturate-125 sepia-[0.2]",
      roomGlow: "shadow-[0_0_90px_rgba(251,146,60,0.4)]",
      windowLight: "bg-gradient-to-t from-orange-400/50 via-rose-300/40 to-indigo-900/40",
    },
    night: {
      bg: "from-slate-950 via-slate-900 to-indigo-950",
      ambient: "brightness-85 contrast-125 saturate-90",
      roomGlow: "shadow-[0_0_100px_rgba(99,102,241,0.35)]",
      windowLight: "bg-gradient-to-t from-indigo-950 via-slate-900 to-slate-950 border-sky-400/20",
    },
  }[lightingMode];

  const hotspots = [
    {
      id: "bed",
      title: "Plush King Size Bed",
      desc: "300TC Egyptian cotton sheets, posture-pedic mattress & down pillows.",
      top: "45%",
      left: "48%",
      icon: <Bed className="w-3.5 h-3.5" />,
    },
    {
      id: "view",
      title: "Panoramic Skyline Window",
      desc: "Soundproof double-glazed glass with motorized blackout curtains.",
      top: "22%",
      left: "75%",
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      id: "desk",
      title: "Executive Work Station",
      desc: "Ergonomic leather chair, high-speed WiFi 6 & wireless charging dock.",
      top: "60%",
      left: "22%",
      icon: <Wifi className="w-3.5 h-3.5" />,
    },
    {
      id: "bath",
      title: "Italian Marble En-Suite Bath",
      desc: "Rainfall walk-in shower, soaking bathtub and herbal bath amenities.",
      top: "35%",
      left: "15%",
      icon: <Bath className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] p-0 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#E6DDD0] flex flex-wrap items-center justify-between gap-3 bg-[#FAF6EF]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#C2410C]/10 text-[#C2410C] border border-[#C2410C]/20">
                3D Virtual Space
              </span>
              <h3 className="text-lg font-black text-[#1E293B]">{room.name}</h3>
            </div>
            <p className="text-xs text-[#786C60] mt-0.5">
              {hotelName} • {room.sizeSqFt} sq.ft ({room.sizeM2} m²) • {room.bedType}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-[#E6DDD0]">
            <button
              type="button"
              onClick={() => setActiveTab("3d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "3d"
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "text-[#57534E] hover:text-[#1E293B]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Tour</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("photos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "photos"
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "text-[#57534E] hover:text-[#1E293B]"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Photos ({room.images.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("floorplan")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === "floorplan"
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "text-[#57534E] hover:text-[#1E293B]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Floor Plan</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF6EF]">
          {activeTab === "3d" && (
            <div className="space-y-4">
              {/* 3D Canvas / Viewport */}
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`relative h-[380px] sm:h-[460px] rounded-3xl overflow-hidden border border-[#E6DDD0] cursor-grab active:cursor-grabbing select-none transition-all duration-700 bg-gradient-to-br ${lightingStyles.bg} flex items-center justify-center`}
                style={{ perspective: "1000px" }}
              >
                {/* 3D Room Box Model */}
                <div
                  className={`relative w-[92%] h-[86%] rounded-2xl overflow-hidden border-2 border-white/60 transition-transform duration-150 ease-out shadow-2xl ${lightingStyles.roomGlow}`}
                  style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Photo Base with dynamic lighting filters */}
                  <img
                    src={room.images[photoIndex % room.images.length]}
                    alt={room.name}
                    className={`w-full h-full object-cover transition-all duration-700 ${lightingStyles.ambient}`}
                  />

                  {/* Window Light Overlay effect */}
                  <div className={`absolute inset-0 pointer-events-none ${lightingStyles.windowLight} opacity-30 mix-blend-overlay`} />

                  {/* Interactive Hotspot Beacons */}
                  {hotspots.map((spot) => {
                    const isSelected = activeHotspot === spot.id;
                    return (
                      <div
                        key={spot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHotspot(spot.id);
                        }}
                        style={{ top: spot.top, left: spot.left }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          {/* Pulsing ring */}
                          <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#C2410C] opacity-75" />
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg transition-transform ${
                              isSelected
                                ? "bg-[#C2410C] scale-125 ring-2 ring-white"
                                : "bg-[#1E293B]/90 hover:scale-110"
                            }`}
                          >
                            {spot.icon}
                          </div>
                        </div>

                        {/* Tooltip on active */}
                        {isSelected && (
                          <div className="absolute left-1/2 bottom-9 transform -translate-x-1/2 w-52 bg-[#1E293B]/95 text-white p-2.5 rounded-xl shadow-xl border border-white/20 text-center pointer-events-none animate-in fade-in zoom-in-95 z-30">
                            <span className="text-[11px] font-black text-amber-400 block mb-0.5">
                              {spot.title}
                            </span>
                            <span className="text-[10px] text-stone-300 block leading-tight">
                              {spot.desc}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Control HUD Overlay */}
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-[11px] font-semibold">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Drag mouse to rotate 360°</span>
                </div>

                {/* Ambient Lighting Mode Selector */}
                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/65 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                  <button
                    type="button"
                    onClick={() => setLightingMode("day")}
                    title="Daylight Mode"
                    className={`p-1.5 rounded-xl transition-all ${
                      lightingMode === "day" ? "bg-amber-500 text-white shadow-xs" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightingMode("sunset")}
                    title="Sunset Golden Hour Mode"
                    className={`p-1.5 rounded-xl transition-all ${
                      lightingMode === "sunset" ? "bg-rose-500 text-white shadow-xs" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    <Sunset className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightingMode("night")}
                    title="Night Mood Mode"
                    className={`p-1.5 rounded-xl transition-all ${
                      lightingMode === "night" ? "bg-indigo-600 text-white shadow-xs" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom hot-spot drawer description */}
                {activeHotspot && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200/80 shadow-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center font-bold">
                        {hotspots.find((h) => h.id === activeHotspot)?.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[#1E293B]">
                          {hotspots.find((h) => h.id === activeHotspot)?.title}
                        </h4>
                        <p className="text-[11px] text-[#786C60]">
                          {hotspots.find((h) => h.id === activeHotspot)?.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wide bg-[#C2410C]/10 px-2 py-0.5 rounded-full">
                      Hotspot Inspected
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="space-y-4">
              <div className="relative h-80 rounded-3xl overflow-hidden border border-[#E6DDD0] shadow-sm">
                <img
                  src={room.images[photoIndex]}
                  alt={`${room.name} photo`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoIndex((photoIndex - 1 + room.images.length) % room.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((photoIndex + 1) % room.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {photoIndex + 1} / {room.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {room.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoIndex(i)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                      photoIndex === i ? "border-[#C2410C] scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "floorplan" && (
            <div className="bg-white border border-[#E6DDD0] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E6DDD0] pb-4">
                <div>
                  <h4 className="text-base font-black text-[#1E293B]">Architectural Floor Plan Blueprint</h4>
                  <p className="text-xs text-[#786C60]">
                    Total Living Area: <strong>{room.sizeSqFt} sq.ft</strong> / <strong>{room.sizeM2} m²</strong>
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  {room.viewType} • Level {room.floorLevel}
                </span>
              </div>

              {/* Graphical Blueprint Visualizer */}
              <div className="relative h-64 bg-slate-900 rounded-2xl p-5 border-2 border-dashed border-slate-700 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="flex justify-between items-start text-xs font-mono text-cyan-400 z-10">
                  <span>[ENTRYWAY / FOYER: 4.5m × 1.8m]</span>
                  <span>[BALCONY TERACE: 6.2m × 2.4m]</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center my-auto z-10">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                    <span className="block font-bold text-white mb-1">En-Suite Bath</span>
                    Rain Shower, Vanity, Deep Soaking Tub
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-amber-500/40 text-amber-300 text-xs font-mono">
                    <span className="block font-bold text-white mb-1">Master Suite</span>
                    {room.bedType}, Nightstands, Wardrobe
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    <span className="block font-bold text-white mb-1">Lounge & Desk</span>
                    Ergonomic Study, Mini-bar, Smart TV
                  </div>
                </div>
                <div className="flex justify-between items-end text-xs font-mono text-cyan-400 z-10">
                  <span>CEILING HEIGHT: 3.2m</span>
                  <span>SOUNDPROOFING RATING: STC 55</span>
                </div>
              </div>

              {/* Room Specifications Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E6DDD0]">
                  <span className="text-[#786C60] block font-medium">Bed Setup</span>
                  <span className="text-sm font-black text-[#1E293B]">{room.bedType}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E6DDD0]">
                  <span className="text-[#786C60] block font-medium">Occupancy</span>
                  <span className="text-sm font-black text-[#1E293B]">Up to {room.maxGuests} Guests</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E6DDD0]">
                  <span className="text-[#786C60] block font-medium">View Aspect</span>
                  <span className="text-sm font-black text-[#1E293B]">{room.viewType}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#E6DDD0]">
                  <span className="text-[#786C60] block font-medium">Floor Assignment</span>
                  <span className="text-sm font-black text-[#1E293B]">{room.floorLevel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Included Amenities List */}
          <div className="mt-4 bg-white border border-[#E6DDD0] rounded-2xl p-4">
            <h4 className="text-xs font-black text-[#1E293B] uppercase tracking-wider mb-2.5">
              Room Inclusions &amp; Amenities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#57534E]">
              {room.amenities.map((am, i) => (
                <div key={i} className="flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-[#047857] flex-shrink-0" />
                  <span>{am}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with Pricing & Select Button */}
        <div className="px-6 py-4 border-t border-[#E6DDD0] bg-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#786C60]">Per Night Rate</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-[#1E293B]">
                ₹ {room.pricePerNight.toLocaleString("en-IN")}
              </span>
              {room.priceDifference > 0 && (
                <span className="text-xs font-bold text-[#C2410C]">
                  (+₹{room.priceDifference.toLocaleString("en-IN")} upgrade)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E6DDD0] text-[#57534E] hover:bg-stone-50 rounded-xl font-bold text-xs"
            >
              Close Preview
            </Button>
            {onSelectRoom && (
              <Button
                type="button"
                onClick={() => {
                  onSelectRoom(room);
                  onOpenChange(false);
                }}
                className="bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl font-black text-xs px-5 shadow-sm"
              >
                Select This Room Type
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
