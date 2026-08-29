"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Link from "next/link";
import {
  Plane,
  ShieldCheck,
  Tag,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  Luggage,
  Calendar,
  Users,
  Info,
  Sparkles,
  Building2,
  CheckCircle2,
  Ticket,
  CreditCard,
  Lock,
  ChevronRight,
  Gift,
  HelpCircle,
  Award,
  MapPin,
  X,
} from "lucide-react";
import { getflights, bookFlightApi } from "@/lib/api";
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

interface PromoCode {
  code: string;
  discount: number;
  description: string;
  terms: string;
}

const AVAILABLE_PROMOS: PromoCode[] = [
  {
    code: "MMTSECURE",
    discount: 299,
    description: "Get an instant discount of ₹299 on your flight booking & complimentary Trip Secure coverage.",
    terms: "Valid on all domestic carriers. Non-refundable.",
  },
  {
    code: "SPECIALUPI",
    discount: 362,
    description: "Use this code and get ₹362 instant discount on payments via UPI & Net Banking only!",
    terms: "Applicable on payment through authorized UPI handles.",
  },
  {
    code: "RETROTOUR",
    discount: 1200,
    description: "First-time voyager discount: Flat ₹1,200 off on any round-trip or direct carrier flight.",
    terms: "Exclusive to registered MakeMyTour passenger accounts.",
  },
];

const ADDON_HOTEL_DEALS = [
  {
    name: "Heritage Grand Palace & Spa",
    city: "City Center",
    price: "₹3,499",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
    tag: "Best Seller",
  },
  {
    name: "The Waterfront Boutique Suite",
    city: "Harbor Promenade",
    price: "₹4,200",
    img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600",
    tag: "Best Seller",
  },
  {
    name: "Luxury Airport Transit Hotel",
    city: "Terminal 2 Concourse",
    price: "₹2,899",
    img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600",
    tag: "Best Seller",
  },
];

export default function BookFlightPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);

  const flightId = params?.id as string;

  // Passenger details
  const [firstName, setFirstName] = useState(user?.firstName || "John");
  const [lastName, setLastName] = useState(user?.lastName || "Doe");
  const [email, setEmail] = useState(user?.email || "passenger@makemytour.com");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "+91 98765 43210");
  const [ticketCount, setTicketCount] = useState<number>(() => {
    const raw = Number(searchParams.get("tickets"));
    return raw && raw > 0 ? raw : 1;
  });

  // Flight parameters from URL or database
  const [flightData, setFlightData] = useState<any>(() => ({
    id: flightId || "FL-100",
    airline: searchParams.get("airline") || "SkyHigh 202",
    flightNumber: searchParams.get("flightNumber") || "IX 2747",
    aircraft: "Airbus A320",
    origin: searchParams.get("origin") || "Paris",
    destination: searchParams.get("destination") || "Tokyo",
    departureTime: searchParams.get("departureTime") || "2025-01-21T15:41:00",
    arrivalTime: searchParams.get("arrivalTime") || "2025-01-23T16:43:00",
    price: Number(searchParams.get("price")) || 3500,
    classType: searchParams.get("classType") || "Economy",
    durationMinutes: Number(searchParams.get("duration")) || 180,
    stops: searchParams.get("stops") || "Non-stop",
  }));

  // Promo code selection
  const [appliedPromo, setAppliedPromo] = useState<string>("MMTSECURE");
  const [customPromoInput, setCustomPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  // Modal states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [issuedPnr, setIssuedPnr] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName || "");
      if (user.email) setEmail(user.email);
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  // Load flight data from DB if id exists and params empty
  useEffect(() => {
    const fetchFlight = async () => {
      if (flightId && !searchParams.get("airline")) {
        try {
          const allFlights = await getflights();
          const found = allFlights.find((f: any) => f.id === flightId || f._id === flightId);
          if (found) {
            setFlightData({
              id: found.id || found._id,
              airline: found.airline,
              flightNumber: found.flightNumber,
              aircraft: "Airbus A320",
              origin: found.origin,
              destination: found.destination,
              departureTime: found.departureTime,
              arrivalTime: found.arrivalTime,
              price: found.price || 3500,
              classType: found.classType || "Economy",
              durationMinutes: found.durationMinutes || 180,
              stops: found.stops || "Non-stop",
            });
          }
        } catch (e) {
          console.warn("Could not load flight from API:", e);
        }
      }
    };
    fetchFlight();
  }, [flightId, searchParams]);

  // Calculate pricing breakdown
  const unitBaseFare = flightData.price || 3500;
  const count = Math.max(1, ticketCount);
  const baseFare = unitBaseFare * count;
  const taxesAndSurcharges = Math.round(baseFare * 0.392);
  const otherServices = Math.round(249 * count);

  const discountAmount = useMemo(() => {
    const matched = AVAILABLE_PROMOS.find((p) => p.code === appliedPromo);
    return matched ? matched.discount * (count > 1 ? Math.min(count, 3) : 1) : 0;
  }, [appliedPromo, count]);

  const totalAmount = Math.max(0, baseFare + taxesAndSurcharges + otherServices - discountAmount);

  const handleApplyCustomPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const codeClean = customPromoInput.trim().toUpperCase();
    const found = AVAILABLE_PROMOS.find((p) => p.code === codeClean);
    if (found) {
      setAppliedPromo(found.code);
      setCustomPromoInput("");
    } else {
      setPromoError("Invalid coupon code. Try MMTSECURE, SPECIALUPI, or RETROTOUR.");
    }
  };

  const handleOpenBookingDetails = () => {
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
      const res = await bookFlightApi(user.id, flightData.id || flightId, count);
      const generatedPnr = res?.id ? `MMT-${res.id.slice(-6).toUpperCase()}` : `MMT-${Math.floor(100000 + Math.random() * 900000)}`;
      setIssuedPnr(generatedPnr);
      setIsProcessing(false);
      setBookingModalOpen(false);
      setBookingComplete(true);
    } catch (err: any) {
      setIsProcessing(false);
      const msg = err?.response?.data?.message || err?.message || "Flight booking failed. Please try again.";
      setBookingError(msg);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });
    } catch {
      return "1/21/2025, 3:41:00 PM";
    }
  };

  const displayTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "03:41 PM";
    }
  };

  const displayDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "January 21, 2025";
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#786C60] hover:text-[#C2410C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Flight Search</span>
        </Link>
        <div className="flex items-center space-x-2 text-xs text-[#786C60]">
          <span className="text-[#C2410C] font-bold">1. Itinerary & Review</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>2. Booking Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>3. Ticket Issued</span>
        </div>
      </div>

      {/* Main Two-Column Booking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Flight Overview, Policies, Addons */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Flight Overview Card */}
          <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-3xl p-6 sm:p-7 shadow-sm relative">
            {/* Header: Route + Cancellation Policy Tag */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DDD0] pb-4 mb-5">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
                  {flightData.origin.split("(")[0]} → {flightData.destination.split("(")[0]}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30 uppercase tracking-wider">
                  Cancellation Fees Apply
                </span>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-[#C2410C] hover:underline inline-flex items-center space-x-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>View Fare Rules</span>
              </button>
            </div>

            {/* Sub-header Date & Non-Stop info */}
            <div className="flex items-center space-x-2 text-xs text-[#786C60] font-semibold mb-6">
              <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>
                {displayDate(flightData.departureTime)} at {displayTime(flightData.departureTime)}
              </span>
              <span>•</span>
              <span className="text-[#047857]">{flightData.stops || "Non Stop"}</span>
              <span>•</span>
              <span>
                {Math.floor(flightData.durationMinutes / 60)}h {flightData.durationMinutes % 60}m
              </span>
            </div>

            {/* Airline Badge & Aircraft Info */}
            <div className="flex items-center space-x-3 mb-6 bg-[#FAF6EF] p-3 rounded-2xl border border-[#E6DDD0]">
              <div className="w-10 h-10 rounded-xl bg-[#1E293B] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-[#334155]">
                <Plane className="w-5 h-5 transform -rotate-12 text-[#C2410C]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-[#1E293B] text-sm">
                    {flightData.airline}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#C2410C]/10 text-[#C2410C] font-bold text-[10px] uppercase">
                    {flightData.classType}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#1E293B]/10 text-[#1E293B] font-bold text-[10px] uppercase tracking-wider">
                    MMTSPECIAL
                  </span>
                </div>
                <p className="text-[11px] text-[#786C60] font-medium mt-0.5">
                  {flightData.flightNumber} • {flightData.aircraft}
                </p>
              </div>
            </div>

            {/* Departure & Arrival Visual Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 py-4 px-4 bg-[#FAF6EF] rounded-2xl border border-[#E6DDD0] mb-6">
              {/* Departure */}
              <div>
                <span className="text-[11px] text-[#786C60] font-bold uppercase tracking-wider block">
                  Departure
                </span>
                <div className="text-xl font-black text-[#1E293B]">
                  {displayTime(flightData.departureTime)}
                </div>
                <div className="text-xs font-bold text-[#57534E] mt-0.5">
                  {displayDate(flightData.departureTime)}
                </div>
                <p className="text-xs text-[#786C60] mt-1 font-medium">
                  {flightData.origin} International Airport, Terminal T2
                </p>
              </div>

              {/* Path & Duration */}
              <div className="text-center flex flex-col items-center">
                <span className="text-xs font-bold text-[#57534E] mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C2410C]" />
                  {Math.floor(flightData.durationMinutes / 60)}h {flightData.durationMinutes % 60}m
                </span>
                <div className="w-full flex items-center justify-center gap-1">
                  <div className="h-[1.5px] flex-1 bg-[#D48B68]/40" />
                  <Plane className="w-4 h-4 text-[#C2410C] transform rotate-90" />
                  <div className="h-[1.5px] flex-1 bg-[#D48B68]/40" />
                </div>
                <span className="text-[10px] font-bold text-[#047857] mt-1 uppercase tracking-wider">
                  {flightData.stops || "Non-stop"}
                </span>
              </div>

              {/* Arrival */}
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-[#786C60] font-bold uppercase tracking-wider block">
                  Arrival
                </span>
                <div className="text-xl font-black text-[#1E293B]">
                  {displayTime(flightData.arrivalTime)}
                </div>
                <div className="text-xs font-bold text-[#57534E] mt-0.5">
                  {displayDate(flightData.arrivalTime)}
                </div>
                <p className="text-xs text-[#786C60] mt-1 font-medium">
                  {flightData.destination} International Airport, Terminal T3
                </p>
              </div>
            </div>

            {/* Baggage Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#57534E] font-medium pt-3 border-t border-[#E6DDD0]">
              <span className="flex items-center space-x-1.5 bg-[#FAF6EF] border border-[#E6DDD0] px-3 py-1.5 rounded-xl">
                <Luggage className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>
                  <strong>Cabin Baggage:</strong> 7 Kgs / Adult
                </span>
              </span>
              <span className="flex items-center space-x-1.5 bg-[#FAF6EF] border border-[#E6DDD0] px-3 py-1.5 rounded-xl">
                <Luggage className="w-3.5 h-3.5 text-[#B45309]" />
                <span>
                  <strong>Check-in Baggage:</strong> 15 Kgs (1 piece only) / Adult
                </span>
              </span>
            </div>
          </div>

          {/* Cancellation & Date Change Policy Card */}
          <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#C2410C]" />
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Cancellation & Date Change Policy
                </h3>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-[#C2410C] hover:underline"
              >
                View Policy
              </button>
            </div>

            <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-[#E6DDD0]">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1E293B] text-amber-50 font-mono font-bold text-xs flex items-center space-x-1">
                  <Plane className="w-3 h-3 text-[#C2410C]" />
                  <span>
                    {flightData.origin.slice(0, 3).toUpperCase()}-{flightData.destination.slice(0, 3).toUpperCase()}
                  </span>
                </span>
                <span className="text-sm font-black text-[#1E293B]">
                  ₹{flightData.price?.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden my-3">
                <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full w-full" />
              </div>

              <div className="flex justify-between text-[11px] text-[#786C60] font-medium">
                <span>Now: Free / Low penalty</span>
                <span>24h Before: Partial Refund</span>
                <span>Departure: No Refund</span>
              </div>
            </div>
          </div>

          {/* Book a Flight & Unlock These Offers Section */}
          <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-[#C2410C]" />
                <h3 className="text-base font-bold text-[#1E293B]">
                  Book a Flight & Unlock These Offers
                </h3>
              </div>
              <span className="bg-[#C2410C]/10 text-[#C2410C] font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-[#C2410C]/20 uppercase tracking-wide">
                Flyer Exclusive Deal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {ADDON_HOTEL_DEALS.map((deal, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-xs hover:border-[#D48B68] transition-all group"
                >
                  <div className="h-28 relative">
                    <img
                      src={deal.img}
                      alt={deal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-[#1E293B]/85 text-amber-50 text-[9px] font-bold px-2 py-0.5 rounded">
                      {deal.tag}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-bold text-[#1E293B] truncate">
                      {deal.name}
                    </h4>
                    <p className="text-[11px] text-[#786C60]">{deal.city}</p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#E6DDD0]">
                      <span className="text-[10px] text-[#786C60]">From {deal.price}</span>
                      <span className="text-[10px] font-bold text-[#C2410C]">Add Stays</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Fare Summary & Promo Codes */}
        <div className="lg:col-span-4 space-y-6 sticky top-20">
          {/* Fare Summary Card */}
          <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-3xl p-6 shadow-md">
            <h3 className="text-base font-black text-[#1E293B] flex items-center space-x-2 border-b border-[#E6DDD0] pb-3 mb-4">
              <Ticket className="w-4 h-4 text-[#C2410C]" />
              <span>Fare Summary</span>
            </h3>

            <div className="space-y-3 text-xs text-[#57534E]">
              <div className="flex justify-between items-center">
                <span>Base Fare ({count} Passenger{count > 1 ? "s" : ""})</span>
                <span className="font-bold text-[#1E293B]">₹ {baseFare.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Taxes and Surcharges</span>
                <span className="font-bold text-[#1E293B]">₹ {taxesAndSurcharges.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Other Services</span>
                <span className="font-bold text-[#1E293B]">₹ {otherServices.toLocaleString("en-IN")}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#047857] font-bold bg-[#047857]/10 p-2 rounded-xl border border-[#047857]/20">
                  <span>Discounts ({appliedPromo})</span>
                  <span>- ₹ {discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="border-t border-[#E6DDD0] pt-3 flex justify-between items-center">
                <span className="text-sm font-black text-[#1E293B]">Total Amount</span>
                <span className="text-xl font-black text-[#C2410C]">
                  ₹ {totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Book Now Button opening Details Modal */}
            <Button
              onClick={handleOpenBookingDetails}
              className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-sm py-3 rounded-2xl shadow-md border border-[#9A3412] mt-5 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Promo Codes Card */}
          <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-3xl p-6 shadow-md">
            <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-wider flex items-center space-x-1.5 mb-4">
              <Gift className="w-4 h-4 text-[#D97706]" />
              <span>Promo Codes & Coupons</span>
            </h3>

            {/* Promo Code Input Form */}
            <form onSubmit={handleApplyCustomPromo} className="flex gap-2 mb-4">
              <Input
                value={customPromoInput}
                onChange={(e) => setCustomPromoInput(e.target.value)}
                placeholder="Enter promo code here"
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] text-xs font-semibold rounded-xl uppercase"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Apply
              </Button>
            </form>

            {promoError && (
              <p className="text-[11px] text-[#BE123C] font-semibold mb-3">
                {promoError}
              </p>
            )}

            {/* Promo list options */}
            <div className="space-y-3">
              {AVAILABLE_PROMOS.map((promo) => (
                <div
                  key={promo.code}
                  onClick={() => setAppliedPromo(promo.code)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    appliedPromo === promo.code
                      ? "bg-[#C2410C]/5 border-[#C2410C] ring-1 ring-[#C2410C]"
                      : "bg-[#FAF6EF] border-[#E6DDD0] hover:border-[#D48B68]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          appliedPromo === promo.code
                            ? "border-[#C2410C] bg-[#C2410C]"
                            : "border-stone-400"
                        }`}
                      >
                        {appliedPromo === promo.code && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-mono font-bold text-xs text-[#1E293B]">
                        {promo.code}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#047857]">
                      Save ₹{promo.discount}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#786C60] leading-relaxed pl-5">
                    {promo.description}
                  </p>
                  <span className="text-[10px] text-[#C2410C] font-bold hover:underline pl-5 block mt-1">
                    Terms & Conditions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FLIGHT BOOKING DETAILS MODAL (MATCHING USER SCREENSHOT) ─── */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="max-w-xl bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] p-6 sm:p-7 rounded-3xl shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E6DDD0]">
            <div className="flex items-center space-x-2">
              <Plane className="w-5 h-5 text-[#C2410C] transform -rotate-12" />
              <DialogTitle className="text-xl font-black text-[#1E293B]">
                Flight Booking Details
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {/* Flight Name */}
            <div>
              <Label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1.5">
                <Plane className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Flight Name</span>
              </Label>
              <Input
                readOnly
                value={flightData.airline}
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] font-semibold rounded-xl text-sm"
              />
            </div>

            {/* From */}
            <div>
              <Label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>From</span>
              </Label>
              <Input
                readOnly
                value={flightData.origin.split("(")[0].trim()}
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] font-semibold rounded-xl text-sm"
              />
            </div>

            {/* To */}
            <div>
              <Label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>To</span>
              </Label>
              <Input
                readOnly
                value={flightData.destination.split("(")[0].trim()}
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] font-semibold rounded-xl text-sm"
              />
            </div>

            {/* Departure Time */}
            <div>
              <Label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Departure Time</span>
              </Label>
              <Input
                readOnly
                value={formatDateTime(flightData.departureTime)}
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] font-semibold rounded-xl text-sm"
              />
            </div>

            {/* Arrival Time */}
            <div>
              <Label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-[#047857]" />
                <span>Arrival Time</span>
              </Label>
              <Input
                readOnly
                value={formatDateTime(flightData.arrivalTime)}
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] font-semibold rounded-xl text-sm"
              />
            </div>

            {/* Number of Tickets */}
            <div>
              <Label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1.5">
                <Ticket className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Number of Tickets</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={9}
                value={ticketCount}
                onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] font-bold rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Fare Summary Box Inside Modal */}
          <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4 space-y-2.5 my-2">
            <div className="flex items-center space-x-2 font-black text-sm text-[#1E293B] border-b border-[#E6DDD0] pb-2">
              <CreditCard className="w-4 h-4 text-[#C2410C]" />
              <span>Fare Summary</span>
            </div>

            <div className="space-y-1.5 text-xs text-[#57534E]">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span className="font-bold text-[#1E293B]">₹ {baseFare.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes and Surcharges</span>
                <span className="font-bold text-[#1E293B]">₹ {taxesAndSurcharges.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Services</span>
                <span className="font-bold text-[#1E293B]">₹ {otherServices.toLocaleString("en-IN")}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#047857] font-bold">
                  <span>Discounts</span>
                  <span>- ₹ {discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="border-t border-[#E6DDD0] pt-2 flex justify-between items-center text-sm font-black text-[#1E293B]">
                <span>Total Amount</span>
                <span className="text-lg font-black text-[#C2410C]">
                  ₹ {totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {bookingError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl mt-2">
              {bookingError}
            </div>
          )}

          {/* Proceed to Payment Button */}
          <Button
            onClick={handleProceedToPayment}
            disabled={isProcessing}
            className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white font-black text-sm py-3 rounded-2xl shadow-md transition-all mt-3 cursor-pointer flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Plane className="w-4 h-4 animate-spin text-white" />
                <span>Processing Payment…</span>
              </>
            ) : (
              <span>Proceed to Payment</span>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Booking Completed Dialog / Official Electronic Voucher */}
      <Dialog open={bookingComplete} onOpenChange={setBookingComplete}>
        <DialogContent className="max-w-lg bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] p-6 rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-[#047857] uppercase tracking-widest mb-1">
              <CheckCircle2 className="w-4 h-4 text-[#047857]" />
              <span>Booking Confirmed & Issued</span>
            </div>
            <DialogTitle className="text-2xl font-black text-[#1E293B]">
              Electronic Travel Itinerary
            </DialogTitle>
            <DialogDescription className="text-xs text-[#786C60]">
              Your official boarding confirmation has been registered with the airline carrier.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">
                    Passenger Name Record
                  </span>
                  <h4 className="text-lg font-black text-[#1E293B]">{issuedPnr}</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30">
                  CONFIRMED
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#57534E]">
                <div className="flex justify-between">
                  <span className="text-[#786C60]">Flight Carrier:</span>
                  <span className="font-bold text-[#1E293B]">
                    {flightData.airline} ({flightData.flightNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786C60]">Route:</span>
                  <span className="font-bold text-[#1E293B]">
                    {flightData.origin} → {flightData.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786C60]">Passengers:</span>
                  <span className="font-bold text-[#1E293B]">
                    {firstName} {lastName} ({ticketCount} Ticket{ticketCount > 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786C60]">Contact:</span>
                  <span className="font-bold text-[#1E293B]">{email}</span>
                </div>
                <div className="flex justify-between border-t border-[#E6DDD0] pt-2">
                  <span className="text-[#786C60]">Total Tariff Paid:</span>
                  <span className="font-black text-base text-[#C2410C]">
                    ₹ {totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => router.push("/")}
                className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
              >
                Return to Storefront
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authentication Required Guard Modal */}
      <SignupDialog
        open={authRequired}
        onOpenChange={setAuthRequired}
        onSuccess={() => {
          setAuthRequired(false);
          setBookingModalOpen(true);
        }}
        promptMessage="Please sign in or create an account to finalize your flight booking."
        initialMode="login"
      />
    </div>
  );
}
