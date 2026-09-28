"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Link from "next/link";
import {
  Hotel as HotelIcon,
  Home,
  MapPin,
  Star,
  Check,
  CreditCard,
  Bed,
  DoorOpen,
  Waves,
  Utensils,
  Wine,
  Zap,
  Wifi,
  ParkingCircle,
  Dumbbell,
  CheckCircle2,
  Ticket,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { gethotelbyid, bookHotelApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SignupDialog from "@/components/ui/SignupDialog";
import ReviewSection from "@/components/Reviews/ReviewSection";
import InteractiveRoomGrid, {
  HotelRoomType,
  generateHotelRoomTypes,
} from "@/components/Hotel/InteractiveRoomGrid";
import DynamicPricePanel from "@/components/DynamicPricePanel";

// ─── Derive varied images per hotel ──────────────────────────────────────────
// We pick from pools of categorised Unsplash photos using the hotel's string ID
// as a stable seed so the same hotel always gets the same set of images.
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200",
];

const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600",
  "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600",
  "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600",
  "https://images.unsplash.com/photo-1560185127-6a8e7bbc4946?w=600",
  "https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=600",
];

const LANDMARK_IMAGES = [
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600",
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600",
  "https://images.unsplash.com/photo-1467226632440-65f0b4957563?w=600",
  "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600",
  "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=600",
  "https://images.unsplash.com/photo-1541447271487-09612b3f49f7?w=600",
  "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600",
];

// Stable hash of a string → integer (same input always → same number)
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getHotelImages(hotelId: string, primaryImageUrl?: string) {
  const seed = stableHash(hotelId || "default");
  const heroImg = primaryImageUrl || HERO_IMAGES[seed % HERO_IMAGES.length];
  const roomImg = ROOM_IMAGES[(seed + 1) % ROOM_IMAGES.length];
  const landmarkImg = LANDMARK_IMAGES[(seed + 2) % LANDMARK_IMAGES.length];
  return { heroImg, roomImg, landmarkImg };
}

// ─── Pricing derived from backend pricePerNight ───────────────────────────────
// discount  = 4.6%  of pricePerNight  (e.g. ₹3000 → ₹138 saving → shows ₹2862)
// tax       = 17.57% of pricePerNight (e.g. ₹3000 → ₹527 tax)
// booking discount (rooms based) = 22% of base fare
function derivePricing(pricePerNight: number, numRooms: number) {
  const discountedPrice = Math.round(pricePerNight * 0.954);
  const taxPerNight = Math.round(pricePerNight * 0.1757);
  const baseFare = pricePerNight * numRooms;
  const taxesAndExtra = taxPerNight * numRooms;
  const discounts = Math.round(baseFare * 0.22);
  const totalAmount = Math.max(0, baseFare + taxesAndExtra - discounts);
  return { discountedPrice, taxPerNight, baseFare, taxesAndExtra, discounts, totalAmount };
}

// ─── Amenity icon mapping ─────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  pool: <Waves className="w-4 h-4 text-blue-600" />,
  swimming: <Waves className="w-4 h-4 text-blue-600" />,
  restaurant: <Utensils className="w-4 h-4 text-amber-600" />,
  bar: <Wine className="w-4 h-4 text-rose-600" />,
  power: <Zap className="w-4 h-4 text-emerald-600" />,
  wifi: <Wifi className="w-4 h-4 text-indigo-600" />,
  wi: <Wifi className="w-4 h-4 text-indigo-600" />,
  parking: <ParkingCircle className="w-4 h-4 text-slate-600" />,
  gym: <Dumbbell className="w-4 h-4 text-orange-600" />,
  spa: <HotelIcon className="w-4 h-4 text-purple-600" />,
};

function getAmenityIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <Check className="w-4 h-4 text-stone-500" />;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookHotelPage() {
  const params = useParams();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const hotelId = params?.id as string;

  // ── State ─────────────────────────────────────────────────────────────────
  const [hotelData, setHotelData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [roomsCount, setRoomsCount] = useState<number>(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [readMore, setReadMore] = useState(false);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [issuedBookingId, setIssuedBookingId] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [allAmenitiesOpen, setAllAmenitiesOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<HotelRoomType | null>(null);
  // Dynamic Pricing state
  const [dynamicUnitFare, setDynamicUnitFare] = useState<number>(0);
  const [isFareFrozen, setIsFareFrozen] = useState<boolean>(false);

  // ── Sync user details once available ─────────────────────────────────────
  useEffect(() => {
    if (user) {
      setGuestName(user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email || "Guest");
      setGuestEmail(user.email || "");
    }
  }, [user]);

  // ── Always fetch fresh from backend by ID ────────────────────────────────
  useEffect(() => {
    if (!hotelId) return;
    setLoading(true);
    setFetchError(null);
    gethotelbyid(hotelId)
      .then((data) => {
        setHotelData(data);
        const rooms = generateHotelRoomTypes(data.pricePerNight || 3000, hotelId);
        setSelectedRoom(rooms[0]);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err?.message || "Failed to load hotel details.");
        setLoading(false);
      });
  }, [hotelId]);

  // ── Derived values ────────────────────────────────────────────────────────
  const numRooms = Math.max(1, Number(roomsCount) || 1);
  const activePricePerNight = selectedRoom ? selectedRoom.pricePerNight : (hotelData?.pricePerNight || 3000);
  // If dynamic pricing has updated the fare, use that instead of room base price
  const effectivePricePerNight = dynamicUnitFare > 0 ? dynamicUnitFare : activePricePerNight;
  const pricing = hotelData ? derivePricing(effectivePricePerNight, numRooms) : null;
  const images = hotelData ? getHotelImages(hotelData.id || hotelId, hotelData.imageUrl) : null;

  // Amenities as an array (backend stores comma-separated string)
  const amenitiesArr: string[] = hotelData?.amenities
    ? hotelData.amenities.split(",").map((a: string) => a.trim()).filter(Boolean)
    : [];

  const visibleAmenities = amenitiesArr.slice(0, 4);
  const extraAmenitiesCount = Math.max(0, amenitiesArr.length - 4);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenBookingModal = () => {
    if (!user) {
      setAuthRequired(true);
      return;
    }
    setBookingModalOpen(true);
  };

  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleProceedToPayment = async () => {
    if (!user || !user.id) {
      setAuthRequired(true);
      return;
    }
    setIsProcessing(true);
    setBookingError(null);
    try {
      const res = await bookHotelApi(user.id, hotelData.id || hotelId, numRooms, 1);
      const generatedId = res?.id ? `HTL-${res.id.slice(-6).toUpperCase()}` : `HTL-${Math.floor(100000 + Math.random() * 900000)}`;
      setIssuedBookingId(generatedId);
      setIsProcessing(false);
      setBookingModalOpen(false);
      setBookingComplete(true);
    } catch (err: any) {
      setIsProcessing(false);
      const msg = err?.response?.data?.message || err?.message || "Hotel booking failed. Please try again.";
      setBookingError(msg);
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-stone-600">
          <Loader2 className="w-10 h-10 animate-spin text-[#C2410C]" />
          <p className="text-sm font-semibold">Loading hotel details…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !hotelData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-sm w-full text-center shadow-sm space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-stone-900">Hotel Not Found</h2>
          <p className="text-xs text-stone-500">{fetchError || "Could not load hotel data."}</p>
          <Button onClick={() => router.push("/")} className="bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-xl text-xs font-bold">
            Back to Storefront
          </Button>
        </div>
      </div>
    );
  }

  const { heroImg, roomImg, landmarkImg } = images!;
  const { discountedPrice, taxPerNight, baseFare, taxesAndExtra, discounts, totalAmount } = pricing!;
  const cityDisplay = hotelData.city || "India";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF6EF]/70 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* ─── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center space-x-2 text-xs text-stone-500 mb-4 font-medium">
        <Link href="/" className="hover:text-blue-600 hover:underline transition-colors">Home</Link>
        <span className="text-stone-400">&gt;</span>
        <Link href="/#hotels" className="hover:text-blue-600 hover:underline transition-colors">{cityDisplay}</Link>
        <span className="text-stone-400">&gt;</span>
        <span className="text-stone-800 font-semibold">{hotelData.name}</span>
      </nav>

      {/* ─── Hotel Title & Rating ────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">{hotelData.name}</h1>
        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < (hotelData.starRating ?? 3) ? "text-amber-400 fill-amber-400" : "text-stone-300"}`} />
          ))}
          {hotelData.address && (
            <span className="text-xs text-stone-500 ml-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#C2410C]" />{hotelData.address}
            </span>
          )}
        </div>
      </div>

      {/* ─── Main Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6">

          {/* Photo Gallery — hotel-specific images */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Large primary image */}
            <div className="sm:col-span-2 relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 group">
              <img
                src={heroImg}
                alt={hotelData.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = HERO_IMAGES[0]; }}
              />
              <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center space-x-1.5 border border-white/20">
                <span>📷</span>
                <span>+91 Property Photos</span>
              </div>
            </div>

            {/* Two stacked secondary images — unique per hotel */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 h-64 sm:h-80">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 group">
                <img
                  src={roomImg}
                  alt="Room interior"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = ROOM_IMAGES[0]; }}
                />
              </div>
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm border border-stone-200/80 group">
                <img
                  src={landmarkImg}
                  alt="Nearby landmark"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = LANDMARK_IMAGES[0]; }}
                />
                <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold flex items-center space-x-1 border border-white/20">
                  <span>📷</span>
                  <span>+386 Guest Photos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description — from backend or fallback */}
          <div className="text-sm text-stone-700 leading-relaxed">
            <p>
              {hotelData.description
                ? (readMore ? hotelData.description : hotelData.description.slice(0, 160) + (hotelData.description.length > 160 ? "…" : ""))
                : (readMore
                  ? `${hotelData.name} is a premier hospitality destination in ${cityDisplay}, offering world-class amenities and unmatched comfort. Featuring scenic views, an Olympic-length outdoor swimming pool, complimentary high-speed Wi-Fi, 24/7 in-room dining, and an authentic Ayurvedic wellness sanctuary. Enjoy complimentary morning breakfast buffet, airport shuttle services, and tailor-made sightseeing tours arranged directly by our private concierge desk.`
                  : `${hotelData.name} is a premier hospitality destination in ${cityDisplay}, offering world-class amenities and unmatched comfort.`)
              }
              {(hotelData.description?.length > 160 || !hotelData.description) && (
                <button
                  type="button"
                  onClick={() => setReadMore(!readMore)}
                  className="text-blue-600 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  {readMore ? "Read less" : "Read more"}
                </button>
              )}
            </p>
          </div>

          {/* Amenities — dynamically from backend */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-[#1E293B]">Amenities</h2>
            {amenitiesArr.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-700">
                {visibleAmenities.map((am, i) => (
                  <div key={i} className="flex items-center space-x-1.5 bg-white px-3 py-2 rounded-xl border border-stone-200/70 shadow-xs">
                    {getAmenityIcon(am)}
                    <span>{am}</span>
                  </div>
                ))}
                {extraAmenitiesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAllAmenitiesOpen(true)}
                    className="text-blue-600 hover:underline font-bold text-xs py-2 px-1 cursor-pointer"
                  >
                    + {extraAmenitiesCount} Amenities
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-500">No amenity details available.</p>
            )}
          </div>

          {/* Interactive Room Category Selection Grid with 3D Previews */}
          <div className="pt-4 border-t border-stone-200">
            <InteractiveRoomGrid
              basePrice={hotelData.pricePerNight || 3000}
              hotelName={hotelData.name}
              hotelId={hotelData.id || hotelId}
              selectedRoom={selectedRoom}
              onSelectRoom={(room) => setSelectedRoom(room)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">

          {/* ── Dynamic Pricing Engine Panel ── */}
          <DynamicPricePanel
            basePrice={activePricePerNight}
            bookingId={hotelData.id || hotelId || "hotel-default"}
            type="hotel"
            onPriceChange={(price, frozen) => {
              setDynamicUnitFare(price);
              setIsFareFrozen(frozen);
            }}
          />

          {/* Room Offer Card — dynamically reflects selected room */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E293B]">
                  {selectedRoom?.name || "Standard Room"}
                </h2>
                {selectedRoom?.tag && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedRoom.tagColor || "bg-blue-600 text-white"}`}>
                    {selectedRoom.tag}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {selectedRoom
                  ? `${selectedRoom.sizeSqFt} sq.ft • ${selectedRoom.bedType} • ${selectedRoom.viewType}`
                  : "Fits 2 Adults"}
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-stone-600">
              {selectedRoom ? (
                selectedRoom.perks.map((perk, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="text-[#047857] font-bold">✓</span>
                    <span className="text-stone-800 font-medium">{perk}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-center space-x-2"><span className="text-stone-400">•</span><span>No meals included</span></li>
                  <li className="flex items-center space-x-2"><span className="text-stone-400">•</span><span>10% off on food &amp; beverage services</span></li>
                  <li className="flex items-center space-x-2"><span className="text-stone-400">•</span><span>Complimentary welcome drinks on arrival</span></li>
                </>
              )}
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                <span className="text-emerald-700 font-semibold">Instant Confirmation &amp; Free Cancellation</span>
              </li>
            </ul>

            {/* Live data from backend & room selection */}
            <div className="space-y-1.5 text-xs text-stone-700 pt-2 border-t border-stone-100">
              <div className="flex justify-between">
                <span className="font-semibold text-stone-800">Room Category:</span>
                <span className="font-bold text-[#1E293B]">{selectedRoom?.name || "Standard Room"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-stone-800">Price Per Night:</span>
                <span className="font-bold text-stone-900">₹ {activePricePerNight.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-stone-800">Available Rooms:</span>
                <span className="font-bold text-stone-900">{selectedRoom?.availableInventory ?? hotelData.availableRooms ?? "—"}</span>
              </div>
              {amenitiesArr.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:justify-between pt-0.5">
                  <span className="font-semibold text-stone-800">Amenities:</span>
                  <span className="text-stone-600 font-medium truncate sm:max-w-[200px]" title={hotelData.amenities}>
                    {amenitiesArr.slice(0, 4).join(", ")}
                    {amenitiesArr.length > 4 ? "…" : ""}
                  </span>
                </div>
              )}
            </div>

            {isFareFrozen && (
              <div className="py-1.5 px-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">❄</span> Price frozen — protected from demand surges
                </span>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">LOCKED</span>
              </div>
            )}

            {/* Pricing — derived from active room pricePerNight */}
            <div className="pt-3 border-t border-stone-100 flex items-end justify-between">
              <div>
                <span className="text-xs text-stone-400 line-through block">
                  ₹ {Math.round(activePricePerNight * 1.2).toLocaleString("en-IN")}
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-stone-900">
                    ₹ {discountedPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    + ₹ {taxPerNight.toLocaleString("en-IN")} taxes &amp; fees
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-stone-500 mb-1">Per Night:</span>
            </div>

            <Button
              onClick={handleOpenBookingModal}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm py-3 rounded-lg shadow-sm transition-all uppercase tracking-wide cursor-pointer"
            >
              BOOK THIS NOW
            </Button>

            {amenitiesArr.length > 4 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAllAmenitiesOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {amenitiesArr.length - 4} More Options
                </button>
              </div>
            )}
          </div>

          {/* Review Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-[#2563EB] text-white font-bold text-base rounded-xl flex items-center justify-center shadow-xs">
                {((hotelData.starRating || 3) * 0.76 + 0.4).toFixed(1)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 leading-tight">
                  {(hotelData.starRating || 3) >= 5 ? "Exceptional" : (hotelData.starRating || 3) >= 4 ? "Very Good" : "Good"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">({((hotelData.availableRooms || 10) * 39 + 184)} ratings)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                document.getElementById("hotel-reviews")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              All Reviews
            </button>
          </div>
        </div>
      </div>

      {/* ─── GUEST REVIEWS & RATINGS SECTION ──────────────────────── */}
      <div id="hotel-reviews">
        <ReviewSection
          targetType="HOTEL"
          targetId={hotelData?.id || (typeof hotelId === "string" ? hotelId : "")}
          targetName={hotelData?.name}
        />
      </div>

      {/* ─── MODAL 1: Hotel Booking Details ─────────────────────────────── */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-lg bg-white border border-stone-200 text-stone-900 p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="flex flex-row items-center space-x-2 pb-3 border-b border-stone-100">
            <Home className="w-5 h-5 text-stone-800 flex-shrink-0" />
            <DialogTitle className="text-lg font-bold text-stone-900">Hotel Booking Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Hotel Name */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" /><span>Hotel Name</span>
                </Label>
                <Input readOnly value={hotelData.name} className="bg-stone-50 border-stone-300 text-xs font-medium text-stone-900 rounded-lg h-9" />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" /><span>Location</span>
                </Label>
                <Input readOnly value={cityDisplay} className="bg-stone-50 border-stone-300 text-xs font-medium text-stone-900 rounded-lg h-9" />
              </div>

              {/* Room Category */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
                  <Bed className="w-3.5 h-3.5" /><span>Selected Room Category</span>
                </Label>
                <Input readOnly value={`${selectedRoom?.name || "Standard Room"} (${selectedRoom?.bedType || "King Bed"} • ${selectedRoom?.viewType || "City View"})`} className="bg-stone-50 border-stone-300 text-xs font-bold text-stone-900 rounded-lg h-9" />
              </div>

              {/* Price Per Night — from selected room */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
                  <Ticket className="w-3.5 h-3.5" /><span>Price Per Night</span>
                </Label>
                <Input readOnly value={`₹ ${(activePricePerNight || 0).toLocaleString("en-IN")}`} className="bg-stone-50 border-stone-300 text-xs font-medium text-stone-900 rounded-lg h-9" />
              </div>

              {/* Available Rooms */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
                  <Bed className="w-3.5 h-3.5" /><span>Available Rooms</span>
                </Label>
                <Input readOnly value={selectedRoom?.availableInventory ?? hotelData.availableRooms ?? "—"} className="bg-stone-50 border-stone-300 text-xs font-medium text-stone-900 rounded-lg h-9" />
              </div>
            </div>

            {/* Rooms to Book */}
            <div className="space-y-1 sm:w-1/2">
              <Label className="text-xs font-semibold text-stone-700 flex items-center space-x-1">
                <DoorOpen className="w-3.5 h-3.5" /><span>Number of Rooms to Book</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={hotelData.availableRooms || 50}
                value={roomsCount}
                onChange={(e) => setRoomsCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-stone-50 border-stone-300 text-xs font-medium text-stone-900 rounded-lg h-9"
              />
            </div>

            {/* Fare Summary — all computed from live backend pricePerNight */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-800">
                <CreditCard className="w-4 h-4 text-slate-700" />
                <span>Fare Summary</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <div className="flex justify-between items-center">
                  <span>Base Fare</span>
                  <span className="font-semibold text-slate-900">₹ {baseFare.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taxes and Extracharges</span>
                  <span className="font-semibold text-slate-900">₹ {taxesAndExtra.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span>Discounts</span>
                  <span>- ₹ {discounts.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-extrabold text-slate-900">
                  <span className="text-sm">Total Amount</span>
                  <span className="text-base">₹ {totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {bookingError}
              </div>
            )}

            <Button
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className="w-full bg-[#18181B] hover:bg-black text-white font-bold text-sm py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing Payment…</span></>
              ) : (
                <span>Proceed to Payment</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: Booking Confirmed Voucher ─────────────────────────── */}
      <Dialog open={bookingComplete} onOpenChange={setBookingComplete}>
        <DialogContent className="max-w-lg bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] p-6 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-[#047857] uppercase tracking-widest mb-1">
              <CheckCircle2 className="w-4 h-4 text-[#047857]" />
              <span>Hotel Stay Confirmed &amp; Guaranteed</span>
            </div>
            <DialogTitle className="text-2xl font-black text-[#1E293B]">Electronic Hotel Voucher</DialogTitle>
            <DialogDescription className="text-xs text-[#786C60]">
              Your room reservation has been officially registered with the hotel desk.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">Booking Reference ID</span>
                  <h4 className="text-lg font-black text-[#1E293B]">{issuedBookingId}</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30">CONFIRMED</span>
              </div>
              <div className="space-y-2 text-xs text-[#57534E]">
                <div className="flex justify-between"><span className="text-[#786C60]">Hotel Property:</span><span className="font-bold text-[#1E293B]">{hotelData.name}</span></div>
                <div className="flex justify-between"><span className="text-[#786C60]">Destination:</span><span className="font-bold text-[#1E293B]">{cityDisplay}</span></div>
                <div className="flex justify-between"><span className="text-[#786C60]">Room Category:</span><span className="font-bold text-[#1E293B]">{selectedRoom?.name || "Standard Room"} ({selectedRoom?.bedType || "King Bed"}, {numRooms} Room{numRooms > 1 ? "s" : ""})</span></div>
                <div className="flex justify-between"><span className="text-[#786C60]">Lead Guest:</span><span className="font-bold text-[#1E293B]">{guestName || "Guest"}</span></div>
                <div className="flex justify-between"><span className="text-[#786C60]">Contact Email:</span><span className="font-bold text-[#1E293B]">{guestEmail || "—"}</span></div>
                <div className="flex justify-between border-t border-[#E6DDD0] pt-2"><span className="text-[#786C60]">Total Tariff Paid:</span><span className="font-black text-base text-[#C2410C]">₹ {totalAmount.toLocaleString("en-IN")}</span></div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => router.push("/")} className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer">
                Return to Storefront
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: All Amenities ──────────────────────────────────────── */}
      <Dialog open={allAmenitiesOpen} onOpenChange={setAllAmenitiesOpen}>
        <DialogContent className="max-w-md bg-white border border-stone-200 p-5 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-stone-900">Property Amenities &amp; Inclusions</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              All facilities available at {hotelData.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 pt-3 max-h-64 overflow-y-auto">
            {amenitiesArr.length > 0 ? (
              amenitiesArr.map((am, i) => (
                <span key={i} className="flex items-center space-x-1.5">
                  {getAmenityIcon(am)}
                  <span>{am}</span>
                </span>
              ))
            ) : (
              <p className="col-span-2 text-stone-500 text-center py-4">No amenity data available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Auth Guard ──────────────────────────────────────────────────── */}
      <SignupDialog
        open={authRequired}
        onOpenChange={setAuthRequired}
        onSuccess={() => { setAuthRequired(false); setBookingModalOpen(true); }}
        promptMessage="Please sign in or create an account to finalize your hotel reservation."
        initialMode="login"
      />
    </div>
  );
}
