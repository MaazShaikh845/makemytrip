"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import SignupDialog from "@/components/ui/SignupDialog";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Plane,
  Hotel,
  Compass,
  Search,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Award,
  Headphones,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowRight,
  Luggage,
  Utensils,
  CreditCard,
  Ticket,
  Star,
  Building2,
  Check,
  Tag,
  Percent,
  Compass as CompassIcon,
  Flame,
  Globe2,
} from "lucide-react";
import { getflights, gethotels } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface FlightRecord {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  classType: string;
  durationMinutes: number;
  stops?: string;
  isDatabase?: boolean;
  refundable?: boolean;
  mealIncluded?: boolean;
  baggage?: string;
}

export interface HotelRecord {
  id: string;
  name: string;
  city: string;
  address: string;
  imageUrl?: string;
  pricePerNight: number;
  starRating: number;
  availableRooms: number;
  amenities: string;
  isDatabase?: boolean;
}

export interface TourRecord {
  id: string;
  title: string;
  destination: string;
  duration: string;
  price: number;
  rating: number;
  highlights: string[];
  imageUrl: string;
}

const PRESET_ROUTES = [
  { from: "Delhi (DEL)", to: "Mumbai (BOM)", label: "DEL → BOM", price: "₹3,850" },
  { from: "Bengaluru (BLR)", to: "Hyderabad (HYD)", label: "BLR → HYD", price: "₹2,999" },
  { from: "Delhi (DEL)", to: "Goa (GOI)", label: "DEL → GOI", price: "₹4,120" },
  { from: "Mumbai (BOM)", to: "Dubai (DXB)", label: "BOM → DXB", price: "₹9,400" },
  { from: "New York (JFK)", to: "London (LHR)", label: "JFK → LHR", price: "₹28,500" },
];

const TRENDING_GETAWAYS = [
  {
    title: "Goa Sun & Beaches",
    tag: "Trending Beach",
    price: "₹4,120",
    from: "Delhi (DEL)",
    to: "Goa (GOI)",
    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600",
  },
  {
    title: "Royal Jaipur Forts",
    tag: "Heritage Special",
    price: "₹2,890",
    from: "Mumbai (BOM)",
    to: "Jaipur (JAI)",
    img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600",
  },
  {
    title: "Kashmir Valley Snow",
    tag: "Mountain Escape",
    price: "₹5,400",
    from: "Delhi (DEL)",
    to: "Srinagar (SXR)",
    img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600",
  },
  {
    title: "Dubai Skyline & Safari",
    tag: "International",
    price: "₹9,400",
    from: "Mumbai (BOM)",
    to: "Dubai (DXB)",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600",
  },
];

export default function Home() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<"flights" | "hotels" | "tours">("flights");

  // Search parameters
  const [origin, setOrigin] = useState("Delhi (DEL)");
  const [destination, setDestination] = useState("Mumbai (BOM)");
  const [departureDate, setDepartureDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [passengerCount, setPassengerCount] = useState("1");
  const [cabinClass, setCabinClass] = useState("ECONOMY");

  // Data states
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & sorting
  const [onlyNonStop, setOnlyNonStop] = useState(false);
  const [sortOption, setSortOption] = useState<"price" | "duration" | "departure">("price");

  // Booking Modal States
  const [activeFlightReservation, setActiveFlightReservation] = useState<FlightRecord | null>(null);
  const [activeHotelReservation, setActiveHotelReservation] = useState<HotelRecord | null>(null);
  const [activeTourReservation, setActiveTourReservation] = useState<TourRecord | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [clientName, setClientName] = useState("John Doe");
  const [clientEmail, setClientEmail] = useState("passenger@makemytour.com");
  const [clientPhone, setClientPhone] = useState("+91 9876543210");

  const parseAirportCode = (str: string) => {
    const match = str.match(/\(([^)]+)\)/);
    return match ? match[1] : str.trim();
  };

  const parseCityLabel = (str: string) => {
    return str.split("(")[0].trim();
  };

  const swapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const createSimulatedFleet = useCallback(
    (orig: string, dest: string, baseDate: string, seatClass: string): FlightRecord[] => {
      const origCode = parseAirportCode(orig).toUpperCase();
      const destCode = parseAirportCode(dest).toUpperCase();

      const airlineFleet = [
        {
          airline: "Air India Express",
          flightNumber: "AI-802",
          depHour: 6,
          depMin: 15,
          duration: 130,
          baseRate: 4200,
          stops: "Non-stop",
          meal: true,
          baggage: "15kg check-in + 7kg cabin",
        },
        {
          airline: "IndiGo Airways",
          flightNumber: "6E-204",
          depHour: 9,
          depMin: 45,
          duration: 125,
          baseRate: 3850,
          stops: "Non-stop",
          meal: false,
          baggage: "15kg check-in + 7kg cabin",
        },
        {
          airline: "Vistara Premier",
          flightNumber: "UK-955",
          depHour: 14,
          depMin: 0,
          duration: 135,
          baseRate: 5100,
          stops: "Non-stop",
          meal: true,
          baggage: "20kg check-in + 7kg cabin",
        },
        {
          airline: "SpiceJet Commercial",
          flightNumber: "SG-301",
          depHour: 18,
          depMin: 20,
          duration: 140,
          baseRate: 3499,
          stops: "Non-stop",
          meal: false,
          baggage: "15kg check-in + 7kg cabin",
        },
        {
          airline: "Emirates International",
          flightNumber: "EK-508",
          depHour: 21,
          depMin: 30,
          duration: 275,
          baseRate: 9400,
          stops: "1 Stop",
          meal: true,
          baggage: "30kg check-in + 7kg cabin",
        },
      ];

      const multiplier = seatClass === "BUSINESS" ? 2.8 : seatClass === "FIRST" ? 4.5 : 1;

      return airlineFleet.map((plane, idx) => {
        const departure = new Date(`${baseDate}T00:00:00`);
        departure.setHours(plane.depHour, plane.depMin, 0, 0);

        const arrival = new Date(departure.getTime() + plane.duration * 60000);

        return {
          id: `dyn-flt-${idx}-${Date.now()}`,
          airline: plane.airline,
          flightNumber: plane.flightNumber,
          origin: origCode,
          destination: destCode,
          departureTime: departure.toISOString(),
          arrivalTime: arrival.toISOString(),
          price: Math.round(plane.baseRate * multiplier),
          availableSeats: Math.floor(Math.random() * 20) + 4,
          classType: seatClass,
          durationMinutes: plane.duration,
          stops: plane.stops,
          isDatabase: false,
          refundable: true,
          mealIncluded: plane.meal,
          baggage: plane.baggage,
        };
      });
    },
    []
  );

  // Execute Search query
  const executeFlightLookup = useCallback(
    async (fromLoc = origin, toLoc = destination, date = departureDate, seatClass = cabinClass) => {
      setIsLoading(true);

      const targetOrig = parseAirportCode(fromLoc).toLowerCase();
      const targetDest = parseAirportCode(toLoc).toLowerCase();
      const targetCityOrig = parseCityLabel(fromLoc).toLowerCase();
      const targetCityDest = parseCityLabel(toLoc).toLowerCase();

      let matchedItems: FlightRecord[] = [];

      try {
        const dbRecords = await getflights();
        if (Array.isArray(dbRecords) && dbRecords.length > 0) {
          matchedItems = dbRecords
            .filter((item: any) => {
              const orig = (item.origin || "").toLowerCase();
              const dest = (item.destination || "").toLowerCase();

              const origValid =
                !targetOrig ||
                orig.includes(targetOrig) ||
                targetOrig.includes(orig) ||
                orig.includes(targetCityOrig) ||
                targetCityOrig.includes(orig);

              const destValid =
                !targetDest ||
                dest.includes(targetDest) ||
                targetDest.includes(dest) ||
                dest.includes(targetCityDest) ||
                targetCityDest.includes(dest);

              return origValid && destValid;
            })
            .map((item: any) => ({
              id: item.id || `db-${item.flightNumber}`,
              airline: item.airline || "Commercial Airline",
              flightNumber: item.flightNumber || "FL-100",
              origin: item.origin || targetOrig.toUpperCase(),
              destination: item.destination || targetDest.toUpperCase(),
              departureTime: item.departureTime || `${date}T08:00:00`,
              arrivalTime: item.arrivalTime || `${date}T10:30:00`,
              price: item.price || 3999,
              availableSeats: item.availableSeats ?? 30,
              classType: item.classType || seatClass,
              durationMinutes: item.durationMinutes || 150,
              stops: "Non-stop",
              isDatabase: true,
              refundable: true,
              mealIncluded: true,
              baggage: "15kg check-in + 7kg cabin",
            }));
        }
      } catch (err) {
        console.warn("Using simulated fleet as fallback:", err);
      }

      if (matchedItems.length === 0) {
        matchedItems = createSimulatedFleet(fromLoc, toLoc, date, seatClass);
      }

      setFlights(matchedItems);
      setIsLoading(false);
    },
    [origin, destination, departureDate, cabinClass, createSimulatedFleet]
  );

  const initializeHospitalityData = useCallback(async () => {
    try {
      const dbHotels = await gethotels();
      if (Array.isArray(dbHotels) && dbHotels.length > 0) {
        setHotels(
          dbHotels.map((h: any) => ({
            id: h.id || `h-${Math.random()}`,
            name: h.name || "Grand Palace Hotel",
            city: h.city || "Mumbai",
            address: h.address || "Colaba Waterfront",
            pricePerNight: h.pricePerNight || 5500,
            starRating: h.starRating || 5,
            availableRooms: h.availableRooms ?? 12,
            amenities: h.amenities || "Free Wi-Fi • Heritage Dining • Valet Parking • Swimming Pool",
            imageUrl: h.imageUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
            isDatabase: true,
          }))
        );
      } else {
        setHotels([
          {
            id: "h1",
            name: "The Taj Mahal Palace & Tower",
            city: "Mumbai",
            address: "Apollo Bunder, Colaba",
            pricePerNight: 16500,
            starRating: 5,
            availableRooms: 6,
            amenities: "Historic Sea View • Royal Spa • Fine Dining • 24/7 Butler",
            imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
          },
          {
            id: "h2",
            name: "The Oberoi Grand Heritage",
            city: "New Delhi",
            address: "Dr. Zakir Hussain Marg",
            pricePerNight: 12800,
            starRating: 5,
            availableRooms: 8,
            amenities: "Heated Lap Pool • Cigar Lounge • High Tea Room • Concierge",
            imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
          },
          {
            id: "h3",
            name: "ITC Gardenia Luxury Stay",
            city: "Bengaluru",
            address: "Residency Road",
            pricePerNight: 8900,
            starRating: 5,
            availableRooms: 15,
            amenities: "Helipad • Eco-Luxury Suites • Peacock Garden • Organic Cuisine",
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
          },
          {
            id: "h4",
            name: "Heritage Fort Palace & Resort",
            city: "Jaipur",
            address: "Amer Road, Amber",
            pricePerNight: 7200,
            starRating: 4,
            availableRooms: 10,
            amenities: "Courtyard Dining • Folk Performances • Traditional Hammam",
            imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
          },
        ]);
      }
    } catch (err) {
      console.warn("Could not load hotel inventory:", err);
    }

    setTours([
      {
        id: "t1",
        title: "The Royal Rajasthan Heritage Expedition",
        destination: "Jaipur • Jodhpur • Udaipur",
        duration: "7 Days / 6 Nights",
        price: 28999,
        rating: 4.9,
        highlights: ["Amber Fort Guided Tour", "Desert Camp at Sam Dunes", "Lake Pichola Private Boat", "Heritage Hotel Stays"],
        imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800",
      },
      {
        id: "t2",
        title: "God's Own Country: Kerala Backwaters",
        destination: "Kochi • Munnar • Alleppey",
        duration: "6 Days / 5 Nights",
        price: 22499,
        rating: 4.8,
        highlights: ["Luxury Houseboat Cruise", "Tea Plantation Safari", "Ayurvedic Spa Treatment", "All Meals Included"],
        imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800",
      },
      {
        id: "t3",
        title: "Dubai & Emirates Grand Tour",
        destination: "Dubai • Abu Dhabi",
        duration: "5 Days / 4 Nights",
        price: 45999,
        rating: 4.9,
        highlights: ["Burj Khalifa Observation Deck", "Desert Safari with BBQ", "Sheikh Zayed Grand Mosque", "Marina Dhow Cruise"],
        imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      },
    ]);
  }, []);

  useEffect(() => {
    executeFlightLookup("Delhi (DEL)", "Mumbai (BOM)", departureDate, cabinClass);
    initializeHospitalityData();
  }, [executeFlightLookup, initializeHospitalityData, departureDate, cabinClass]);

  const displayTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "08:00 AM";
    }
  };

  const displayDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Auth & Security modal states
  const [authRequiredOpen, setAuthRequiredOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState("");
  const [pendingBooking, setPendingBooking] = useState<{
    type: "flight" | "hotel" | "tour";
    item: any;
  } | null>(null);

  const router = useRouter();

  const startFlightBooking = (flight: FlightRecord) => {
    const query = new URLSearchParams({
      origin: flight.origin,
      destination: flight.destination,
      price: flight.price.toString(),
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      classType: flight.classType,
      duration: flight.durationMinutes.toString(),
      stops: flight.stops || "Non-stop",
    });
    router.push(`/book-flight/${flight.id}?${query.toString()}`);
  };

  const triggerFlightBooking = (flight: FlightRecord) => {
    if (!user) {
      setAuthPrompt("Please sign in or register to reserve this flight ticket.");
      setPendingBooking({ type: "flight", item: flight });
      setAuthRequiredOpen(true);
      return;
    }
    startFlightBooking(flight);
  };

  const startHotelBooking = (hotel: HotelRecord) => {
    // book-hotel page fetches all data directly from backend by ID
    router.push(`/book-hotel/${hotel.id}`);
  };

  const triggerHotelBooking = (hotel: HotelRecord) => {
    if (!user) {
      setAuthPrompt("Please sign in or register to reserve your hotel accommodation.");
      setPendingBooking({ type: "hotel", item: hotel });
      setAuthRequiredOpen(true);
      return;
    }
    startHotelBooking(hotel);
  };

  const triggerTourBooking = (tour: TourRecord) => {
    if (!user) {
      setAuthPrompt("Please sign in or register to book your holiday tour package.");
      setPendingBooking({ type: "tour", item: tour });
      setAuthRequiredOpen(true);
      return;
    }
    setActiveTourReservation(tour);
    setBookingConfirmed(false);
    setClientName(user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Lead Traveler");
    setClientEmail(user.email || "");
    setClientPhone(user.phoneNumber || "+91 9876543210");
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    if (!pendingBooking) return;
    const { type, item } = pendingBooking;
    setPendingBooking(null);

    const name = authenticatedUser.firstName
      ? `${authenticatedUser.firstName} ${authenticatedUser.lastName || ""}`.trim()
      : "Primary Passenger";
    const email = authenticatedUser.email || "";
    const phone = authenticatedUser.phoneNumber || "+91 9876543210";

    setClientName(name);
    setClientEmail(email);
    setClientPhone(phone);
    setBookingConfirmed(false);

    if (type === "flight") {
      startFlightBooking(item);
    } else if (type === "hotel") {
      startHotelBooking(item);
    } else if (type === "tour") {
      setActiveTourReservation(item);
    }
  };

  const filteredFlightList = useMemo(() => {
    return flights
      .filter((item) => (!onlyNonStop ? true : item.stops?.toLowerCase().includes("non-stop")))
      .sort((a, b) => {
        if (sortOption === "price") return a.price - b.price;
        if (sortOption === "duration") return a.durationMinutes - b.durationMinutes;
        if (sortOption === "departure") return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        return 0;
      });
  }, [flights, onlyNonStop, sortOption]);

  const paxCount = parseInt(passengerCount) || 1;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col justify-center w-full">
      {/* Authentic Human Travel Hero Banner */}
      <div className="mb-6">
        {/* Top Offer Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F3EBDD] border border-[#E6DDD0] px-4 py-2 rounded-xl text-xs text-[#57534E] mb-6">
          <div className="flex items-center space-x-2">
            <span className="bg-[#C2410C] text-white px-2 py-0.5 rounded font-bold text-[10px] uppercase">
              SPECIAL PROMO
            </span>
            <span className="font-semibold text-[#1E293B]">
              Use code <strong className="text-[#C2410C]">RETROTOUR</strong> for flat ₹1,200 discount on your first booking
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-[11px] font-medium text-[#786C60]">
            <span>✈️ Zero Cancellation Option</span>
            <span>•</span>
            <span>🏨 Heritage Hotel Vouchers</span>
          </div>
        </div>

        {/* Hero Title & Direct Value Statement */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1E293B] tracking-tight leading-tight">
            Book Flights, Heritage Stays & Holiday Packages
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#57534E] font-medium max-w-2xl mx-auto">
            Direct airline schedules, verified tariffs, and instant confirmed e-tickets across 500+ daily routes.
          </p>
        </div>
      </div>

      {/* Main Search Panel - Vintage Booking Console */}
      <div className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-3xl p-5 sm:p-7 shadow-md max-w-4xl mx-auto w-full transition-all relative">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-[#E6DDD0] pb-4 mb-6">
          <button
            onClick={() => setActiveTab("flights")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "flights"
                ? "bg-[#C2410C] text-white shadow-xs border border-[#9A3412]"
                : "text-[#57534E] hover:text-[#1E293B] hover:bg-[#F3EBDD]"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Flights</span>
          </button>
          <button
            onClick={() => setActiveTab("hotels")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "hotels"
                ? "bg-[#C2410C] text-white shadow-xs border border-[#9A3412]"
                : "text-[#57534E] hover:text-[#1E293B] hover:bg-[#F3EBDD]"
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>Hotels</span>
          </button>
          <button
            onClick={() => setActiveTab("tours")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === "tours"
                ? "bg-[#C2410C] text-white shadow-xs border border-[#9A3412]"
                : "text-[#57534E] hover:text-[#1E293B] hover:bg-[#F3EBDD]"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Tours</span>
          </button>
        </div>

        {/* Flight Search Fields */}
        {activeTab === "flights" && (
          <div>
            {/* Quick Route Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-4 scrollbar-none text-xs text-[#57534E]">
              <span className="text-[#C2410C] flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> Popular:
              </span>
              {PRESET_ROUTES.map((route, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setOrigin(route.from);
                    setDestination(route.to);
                    executeFlightLookup(route.from, route.to, departureDate, cabinClass);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F3EBDD] hover:bg-[#EAE0CF] border border-[#E6DDD0] text-[#57534E] hover:text-[#1E293B] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1"
                >
                  <span>{route.label}</span>
                  <span className="text-[10px] text-[#C2410C] font-bold">from {route.price}</span>
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-6 relative">
              {/* Origin */}
              <div className="lg:col-span-3 bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5 focus-within:border-[#C2410C] focus-within:ring-1 focus-within:ring-[#C2410C] transition-all">
                <label className="block text-xs font-bold text-[#C2410C] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>From (Origin)</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Delhi (DEL)"
                  className="w-full bg-transparent text-[#1E293B] placeholder-[#A89F91] text-sm font-bold focus:outline-none"
                />
              </div>

              {/* Swap Button */}
              <div className="hidden lg:flex lg:col-span-1 items-center justify-center -mx-2 z-10">
                <button
                  onClick={swapLocations}
                  title="Swap Origin and Destination"
                  className="p-2 bg-[#C2410C] hover:bg-[#9A3412] text-white rounded-full shadow-sm border border-[#9A3412] hover:scale-105 transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination */}
              <div className="lg:col-span-3 bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5 focus-within:border-[#C2410C] focus-within:ring-1 focus-within:ring-[#C2410C] transition-all">
                <label className="block text-xs font-bold text-[#C2410C] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>To (Destination)</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Mumbai (BOM)"
                  className="w-full bg-transparent text-[#1E293B] placeholder-[#A89F91] text-sm font-bold focus:outline-none"
                />
              </div>

              {/* Date */}
              <div className="lg:col-span-3 bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5 focus-within:border-[#C2410C] focus-within:ring-1 focus-within:ring-[#C2410C] transition-all">
                <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                  <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Departure Date</span>
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-transparent text-[#1E293B] text-sm font-bold focus:outline-none"
                />
              </div>

              {/* Passengers & Class */}
              <div className="lg:col-span-2 bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5 focus-within:border-[#C2410C] focus-within:ring-1 focus-within:ring-[#C2410C] transition-all">
                <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                  <Users className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Travellers</span>
                </label>
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value)}
                  className="w-full bg-transparent text-[#1E293B] text-sm font-bold focus:outline-none cursor-pointer"
                >
                  <option value="1">1 Passenger</option>
                  <option value="2">2 Passengers</option>
                  <option value="3">3 Passengers</option>
                  <option value="4">4+ Group</option>
                </select>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="w-full bg-transparent text-[11px] text-[#786C60] font-semibold mt-1 focus:outline-none cursor-pointer"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="BUSINESS">Business Class</option>
                  <option value="FIRST">First Class</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Hotel Search Fields */}
        {activeTab === "hotels" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                <Building2 className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>City or Hotel Name</span>
              </label>
              <input
                type="text"
                defaultValue="Mumbai, Maharashtra"
                className="w-full bg-transparent text-[#1E293B] placeholder-[#A89F91] text-sm font-bold focus:outline-none"
              />
            </div>

            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Check-in Date</span>
              </label>
              <input
                type="date"
                defaultValue={departureDate}
                className="w-full bg-transparent text-[#1E293B] text-sm font-bold focus:outline-none"
              />
            </div>

            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                <Users className="w-3.5 h-3.5 text-[#047857]" />
                <span>Room Configuration</span>
              </label>
              <select className="w-full bg-transparent text-[#1E293B] text-sm font-bold focus:outline-none cursor-pointer">
                <option value="1">2 Adults, 1 Heritage Room</option>
                <option value="2">1 Adult, 1 Room</option>
                <option value="3">Family Royal Suite</option>
              </select>
            </div>
          </div>
        )}

        {/* Tours Search Fields */}
        {activeTab === "tours" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#1E293B] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                <Compass className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Tour Destination</span>
              </label>
              <input
                type="text"
                defaultValue="Rajasthan Heritage Circuit"
                className="w-full bg-transparent text-[#1E293B] placeholder-[#A89F91] text-sm font-bold focus:outline-none"
              />
            </div>

            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Travel Window</span>
              </label>
              <select className="w-full bg-transparent text-[#1E293B] text-sm font-bold focus:outline-none cursor-pointer">
                <option>Upcoming Departures (Next 14 Days)</option>
                <option>Holiday Season Expeditions</option>
                <option>Weekend Getaways</option>
              </select>
            </div>

            <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-3.5">
              <label className="block text-xs font-bold text-[#57534E] mb-1 flex items-center space-x-1.5 uppercase tracking-wide">
                <Star className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Experience Tier</span>
              </label>
              <select className="w-full bg-transparent text-[#1E293B] text-sm font-bold focus:outline-none cursor-pointer">
                <option>Royal Heritage Collection</option>
                <option>Classic Family Discovery</option>
                <option>Scenic Nature & Hills</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Button & Assurance Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E6DDD0]">
          <div className="flex items-center space-x-4 text-xs font-medium text-[#786C60]">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Direct Carrier Tariff</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Headphones className="w-4 h-4 text-[#C2410C]" />
              <span>24/7 Desk Helpline</span>
            </div>
          </div>

          <Button
            size="default"
            disabled={isLoading}
            onClick={() => {
              if (activeTab === "flights") {
                executeFlightLookup(origin, destination, departureDate, cabinClass);
              }
            }}
            className="w-full sm:w-auto bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-sm px-8 py-2.5 rounded-xl shadow-xs border border-[#9A3412] transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Plane className="w-4 h-4 animate-spin text-white" />
                <span>Checking Flight Timetable…</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Trending Travel Spotlight Cards */}
      <div className="mt-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-[#C2410C]" />
            <h2 className="text-lg font-bold text-[#1E293B]">Trending Destinations & Fares</h2>
          </div>
          <span className="text-xs text-[#786C60] font-medium hidden sm:inline">Handcrafted travel getaways</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRENDING_GETAWAYS.map((spot, idx) => (
            <div
              key={idx}
              onClick={() => {
                setOrigin(spot.from);
                setDestination(spot.to);
                setActiveTab("flights");
                executeFlightLookup(spot.from, spot.to, departureDate, cabinClass);
              }}
              className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-sm hover:border-[#D48B68] hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="h-28 relative overflow-hidden">
                <img
                  src={spot.img}
                  alt={spot.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-[#1E293B]/85 text-amber-50 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                  {spot.tag}
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold text-[#1E293B] group-hover:text-[#C2410C] transition-colors truncate">
                  {spot.title}
                </h3>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#E6DDD0] text-[11px]">
                  <span className="text-[#786C60]">Fares from</span>
                  <span className="font-black text-[#C2410C]">{spot.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FLIGHT RESULTS CONTAINER */}
      {activeTab === "flights" && (
        <div className="mt-10 max-w-4xl mx-auto w-full">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 bg-[#FFFDF9]/95 backdrop-blur-md p-4 rounded-2xl border border-[#E6DDD0] shadow-sm">
            <div>
              <div className="flex items-center space-x-2">
                <Plane className="w-4 h-4 text-[#C2410C]" />
                <h2 className="text-base font-bold text-[#1E293B]">
                  Timetable: <span className="text-[#C2410C]">{parseAirportCode(origin)}</span> →{" "}
                  <span className="text-[#1E293B]">{parseAirportCode(destination)}</span>
                </h2>
              </div>
              <p className="text-xs text-[#786C60] mt-0.5 font-medium">
                {filteredFlightList.length} scheduled services • {displayDate(departureDate)} • {passengerCount} Passenger ({cabinClass})
              </p>
            </div>

            {/* Quick Sort & Non-stop Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnlyNonStop(!onlyNonStop)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                  onlyNonStop
                    ? "bg-[#C2410C] text-white border-[#9A3412]"
                    : "bg-[#F3EBDD] text-[#57534E] border-[#E6DDD0] hover:text-[#1E293B]"
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${onlyNonStop ? "opacity-100" : "opacity-0"}`} />
                <span>Non-Stop Only</span>
              </button>

              <div className="flex items-center space-x-1.5 bg-[#F3EBDD] border border-[#E6DDD0] px-2.5 py-1.5 rounded-lg text-xs text-[#57534E] font-semibold">
                <Filter className="w-3.5 h-3.5 text-[#C2410C]" />
                <select
                  value={sortOption}
                  onChange={(e: any) => setSortOption(e.target.value)}
                  className="bg-transparent text-[#1E293B] font-bold focus:outline-none cursor-pointer"
                >
                  <option value="price">Lowest Fare</option>
                  <option value="duration">Shortest Flight</option>
                  <option value="departure">Earliest Takeoff</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards List (Vintage Boarding Pass Style) */}
          {filteredFlightList.length === 0 ? (
            <div className="p-8 text-center bg-[#FFFDF9]/95 backdrop-blur-md rounded-2xl border border-[#E6DDD0] shadow-sm">
              <Plane className="w-8 h-8 text-[#A89F91] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1E293B]">No scheduled flights found matching criteria.</p>
              <Button
                onClick={() => setOnlyNonStop(false)}
                size="sm"
                className="mt-3 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFlightList.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-[#FFFDF9]/95 backdrop-blur-md hover:bg-[#FFFDF9] border border-[#E6DDD0] hover:border-[#D48B68] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative"
                >
                  {/* Left Column: Airline & Flight Schedule */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1E293B] flex items-center justify-center text-amber-50 font-bold text-xs shadow-xs border border-[#334155]">
                          {flight.airline.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#1E293B]">
                            {flight.airline}
                          </h3>
                          <div className="flex items-center space-x-1.5 text-xs text-[#786C60] font-medium">
                            <span className="font-mono font-bold text-[#1E293B]">{flight.flightNumber}</span>
                            <span>•</span>
                            <span>{flight.classType}</span>
                            {flight.isDatabase && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30">
                                Official Record
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="md:hidden text-right">
                        <div className="text-xl font-black text-[#C2410C]">
                          ₹{(flight.price * paxCount).toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-[#786C60] font-medium">{passengerCount} Passenger(s)</span>
                      </div>
                    </div>

                    {/* Flight Timeline visual */}
                    <div className="grid grid-cols-3 items-center gap-2 py-2.5 bg-[#FAF6EF] rounded-xl px-3 border border-[#E6DDD0]">
                      {/* Origin */}
                      <div>
                        <div className="text-lg font-black text-[#1E293B]">
                          {displayTime(flight.departureTime)}
                        </div>
                        <div className="text-xs font-bold text-[#786C60]">
                          {flight.origin}
                        </div>
                      </div>

                      {/* Path & Duration */}
                      <div className="text-center flex flex-col items-center">
                        <span className="text-[11px] font-bold text-[#57534E] mb-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C2410C]" />
                          {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m
                        </span>
                        <div className="w-full flex items-center justify-center gap-1">
                          <div className="h-[1.5px] flex-1 bg-[#D48B68]/40" />
                          <Plane className="w-3.5 h-3.5 text-[#C2410C] transform rotate-90" />
                          <div className="h-[1.5px] flex-1 bg-[#D48B68]/40" />
                        </div>
                        <span className="text-[10px] font-bold text-[#047857] mt-0.5 uppercase tracking-wide">
                          {flight.stops || "Non-stop"}
                        </span>
                      </div>

                      {/* Destination */}
                      <div className="text-right">
                        <div className="text-lg font-black text-[#1E293B]">
                          {displayTime(flight.arrivalTime)}
                        </div>
                        <div className="text-xs font-bold text-[#786C60]">
                          {flight.destination}
                        </div>
                      </div>
                    </div>

                    {/* Amenities tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-[#57534E]">
                      <span className="flex items-center gap-1 bg-[#F3EBDD] border border-[#E6DDD0] px-2.5 py-0.5 rounded-md font-medium">
                        <Luggage className="w-3 h-3 text-[#B45309]" />
                        <span>{flight.baggage || "15kg Baggage"}</span>
                      </span>
                      {flight.mealIncluded && (
                        <span className="flex items-center gap-1 bg-[#F3EBDD] border border-[#E6DDD0] px-2.5 py-0.5 rounded-md font-medium">
                          <Utensils className="w-3 h-3 text-[#047857]" />
                          <span>Meal Included</span>
                        </span>
                      )}
                      <span className="text-[#C2410C] font-bold">
                        {flight.availableSeats} seats available
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Price & Book Button */}
                  <div className="flex md:flex-col items-center justify-between md:items-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#E6DDD0] md:border-l md:border-dashed md:pl-6 md:min-w-[160px]">
                    <div className="hidden md:block text-right">
                      <span className="text-[11px] text-[#786C60] font-medium block">
                        ₹{flight.price.toLocaleString("en-IN")} / pax
                      </span>
                      <div className="text-2xl font-black text-[#C2410C]">
                        ₹{(flight.price * paxCount).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-[#786C60] font-medium">Tariff & Taxes Incl.</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => triggerFlightBooking(flight)}
                      className="w-full sm:w-auto md:w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs border border-[#9A3412] transition-all cursor-pointer"
                    >
                      <span>Reserve Pass</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOTEL LISTINGS */}
      {activeTab === "hotels" && (
        <div className="mt-10 max-w-4xl mx-auto w-full">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1E293B] flex items-center space-x-2">
              <Hotel className="w-5 h-5 text-[#C2410C]" />
              <span>Recommended Heritage Hotels & Suites</span>
            </h2>
            <p className="text-xs text-[#786C60] mt-0.5">
              Verified properties with verified tariffs & flexible check-in guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-sm transition-all hover:border-[#D48B68] hover:shadow-md"
              >
                <div className="h-44 bg-[#FAF6EF] relative">
                  <img
                    src={
                      hotel.imageUrl ||
                      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"
                    }
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-[#1E293B]/90 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center space-x-1 border border-white/20">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-50">{hotel.starRating}.0</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-base font-bold text-[#1E293B]">{hotel.name}</h3>
                  <p className="text-xs text-[#C2410C] mt-0.5 flex items-center space-x-1 font-medium">
                    <MapPin className="w-3 h-3" />
                    <span>{hotel.city} — {hotel.address}</span>
                  </p>

                  <p className="mt-2 text-xs text-[#786C60] line-clamp-2">
                    {hotel.amenities}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-[#E6DDD0] pt-3">
                    <div>
                      <span className="text-[10px] text-[#786C60] block font-bold uppercase tracking-wider">Nightly Tariff</span>
                      <span className="text-lg font-black text-[#C2410C]">
                        ₹{hotel.pricePerNight.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => triggerHotelBooking(hotel)}
                      className="bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold text-xs px-4 py-1.5 rounded-lg cursor-pointer"
                    >
                      Reserve Suite
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOUR PACKAGES */}
      {activeTab === "tours" && (
        <div className="mt-10 max-w-4xl mx-auto w-full">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1E293B] flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#C2410C]" />
              <span>Curated Vacation Itineraries</span>
            </h2>
            <p className="text-xs text-[#786C60] mt-0.5">
              All-inclusive holiday packages with transport, accommodations, and guided tours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tours.map((tour) => (
              <div
                key={tour.id}
                className="bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-sm transition-all flex flex-col justify-between hover:border-[#D48B68] hover:shadow-md"
              >
                <div>
                  <div className="h-40 relative">
                    <img
                      src={tour.imageUrl}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2.5 left-2.5 bg-[#1E293B]/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[11px] font-bold text-amber-300 border border-white/20">
                      {tour.duration}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[#1E293B] leading-snug">
                      {tour.title}
                    </h3>
                    <p className="text-xs text-[#786C60] mt-0.5 font-medium">{tour.destination}</p>

                    <ul className="mt-3 space-y-1 text-xs text-[#57534E]">
                      {tour.highlights.slice(0, 3).map((h, i) => (
                        <li key={i} className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3 h-3 text-[#047857] flex-shrink-0" />
                          <span className="truncate">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 border-t border-[#E6DDD0] bg-[#FAF6EF] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#786C60] block font-bold uppercase tracking-wider">Per Person</span>
                    <span className="text-base font-black text-[#C2410C]">
                      ₹{tour.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => triggerTourBooking(tour)}
                    className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    View Tour
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKING DIALOG MODAL - MATCHING EXACT SCREENSHOT STYLE */}
      <Dialog
        open={!!activeFlightReservation || !!activeHotelReservation || !!activeTourReservation}
        onOpenChange={(open) => {
          if (!open) {
            setActiveFlightReservation(null);
            setActiveHotelReservation(null);
            setActiveTourReservation(null);
            setBookingConfirmed(false);
          }
        }}
      >
        <DialogContent className="max-w-xl bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] p-6 sm:p-7 rounded-3xl shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E6DDD0]">
            <div className="flex items-center space-x-2">
              {activeFlightReservation ? (
                <Plane className="w-5 h-5 text-[#C2410C] transform -rotate-12" />
              ) : activeHotelReservation ? (
                <Hotel className="w-5 h-5 text-[#C2410C]" />
              ) : (
                <Compass className="w-5 h-5 text-[#C2410C]" />
              )}
              <DialogTitle className="text-xl font-black text-[#1E293B]">
                {bookingConfirmed
                  ? "Booking Itinerary Confirmed"
                  : activeFlightReservation
                  ? "Flight Booking Details"
                  : activeHotelReservation
                  ? "Hotel Booking Details"
                  : "Tour Booking Details"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {bookingConfirmed ? (
            <div className="mt-3 space-y-4">
              <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4">
                <div className="flex items-center justify-between border-b border-[#E6DDD0] pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2410C]">
                      Electronic Travel Voucher
                    </span>
                    <h4 className="text-base font-black text-[#1E293B]">
                      PNR: MMT-{Math.floor(100000 + Math.random() * 900000)}
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30">
                    CONFIRMED
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[#57534E]">
                  {activeFlightReservation && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Flight Carrier:</span>
                        <span className="font-bold text-[#1E293B]">
                          {activeFlightReservation.airline} ({activeFlightReservation.flightNumber})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Route:</span>
                        <span className="font-bold text-[#1E293B]">
                          {activeFlightReservation.origin} → {activeFlightReservation.destination}
                        </span>
                      </div>
                    </>
                  )}
                  {activeHotelReservation && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Hotel Property:</span>
                        <span className="font-bold text-[#1E293B]">{activeHotelReservation.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">City & Address:</span>
                        <span className="font-bold text-[#1E293B]">{activeHotelReservation.city}</span>
                      </div>
                    </>
                  )}
                  {activeTourReservation && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Tour Itinerary:</span>
                        <span className="font-bold text-[#1E293B]">{activeTourReservation.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#786C60]">Destination:</span>
                        <span className="font-bold text-[#1E293B]">{activeTourReservation.destination}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#786C60]">Primary Traveler:</span>
                    <span className="font-bold text-[#1E293B]">{clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786C60]">Contact:</span>
                    <span className="font-bold text-[#1E293B]">{clientEmail}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E6DDD0] pt-2">
                    <span className="text-[#786C60]">Total Tariff Paid:</span>
                    <span className="font-black text-sm text-[#C2410C]">
                      ₹{((activeFlightReservation?.price || activeHotelReservation?.pricePerNight || activeTourReservation?.price || 3500) * paxCount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setActiveFlightReservation(null);
                    setActiveHotelReservation(null);
                    setActiveTourReservation(null);
                    setBookingConfirmed(false);
                  }}
                  size="sm"
                  className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold px-5 py-2 text-xs rounded-xl cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              {/* Form Grid matching screenshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Name */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1">
                    <Plane className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>
                      {activeFlightReservation
                        ? "Flight Name"
                        : activeHotelReservation
                        ? "Hotel Name"
                        : "Tour Package"}
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      activeFlightReservation?.airline ||
                      activeHotelReservation?.name ||
                      activeTourReservation?.title ||
                      "SkyHigh 202"
                    }
                    className="w-full bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B]"
                  />
                </div>

                {/* 2. From / City */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>From / City</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      activeFlightReservation?.origin ||
                      activeHotelReservation?.city ||
                      origin ||
                      "Paris"
                    }
                    className="w-full bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B]"
                  />
                </div>

                {/* 3. To / Destination */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>To / Destination</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      activeFlightReservation?.destination ||
                      activeTourReservation?.destination ||
                      destination ||
                      "Tokyo"
                    }
                    className="w-full bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B]"
                  />
                </div>

                {/* 4. Departure Time / Check-in */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>
                      {activeHotelReservation ? "Check-in Date" : "Departure Time"}
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      activeFlightReservation
                        ? `${new Date(activeFlightReservation.departureTime).toLocaleDateString("en-US")}, ${displayTime(activeFlightReservation.departureTime)}`
                        : "1/21/2025, 3:41:00 PM"
                    }
                    className="w-full bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B]"
                  />
                </div>

                {/* 5. Arrival Time / Check-out */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#047857]" />
                    <span>
                      {activeHotelReservation ? "Check-out Date" : "Arrival Time"}
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      activeFlightReservation
                        ? `${new Date(activeFlightReservation.arrivalTime).toLocaleDateString("en-US")}, ${displayTime(activeFlightReservation.arrivalTime)}`
                        : "1/23/2025, 4:43:00 PM"
                    }
                    className="w-full bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B]"
                  />
                </div>

                {/* 6. Number of Tickets / Guests */}
                <div>
                  <label className="text-xs font-bold text-[#57534E] flex items-center space-x-1.5 mb-1">
                    <Ticket className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>
                      {activeHotelReservation ? "Number of Rooms" : "Number of Tickets"}
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(e.target.value)}
                    className="w-full bg-[#FAF6EF] border border-[#E6DDD0] rounded-xl px-3 py-2 text-xs font-bold text-[#1E293B]"
                  />
                </div>
              </div>

              {/* Fare Summary Box matching screenshot */}
              {(() => {
                const unitPrice =
                  activeFlightReservation?.price ||
                  activeHotelReservation?.pricePerNight ||
                  activeTourReservation?.price ||
                  3500;
                const baseF = unitPrice * paxCount;
                const tax = Math.round(baseF * 0.392);
                const other = Math.round(249 * paxCount);
                const disc = Math.round(250 * paxCount);
                const total = baseF + tax + other - disc;

                return (
                  <div className="bg-[#FAF6EF] border border-[#E6DDD0] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center space-x-2 font-black text-sm text-[#1E293B] border-b border-[#E6DDD0] pb-2">
                      <CreditCard className="w-4 h-4 text-[#C2410C]" />
                      <span>Fare Summary</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#57534E]">
                      <div className="flex justify-between">
                        <span>Base Fare</span>
                        <span className="font-bold text-[#1E293B]">₹ {baseF.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes and Surcharges</span>
                        <span className="font-bold text-[#1E293B]">₹ {tax.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Services</span>
                        <span className="font-bold text-[#1E293B]">₹ {other.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-[#047857] font-bold">
                        <span>Discounts</span>
                        <span>- ₹ {disc.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="border-t border-[#E6DDD0] pt-2 flex justify-between items-center text-sm font-black text-[#1E293B]">
                        <span>Total Amount</span>
                        <span className="text-lg font-black text-[#C2410C]">
                          ₹ {total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Proceed to Payment Button */}
              <Button
                onClick={() => setBookingConfirmed(true)}
                className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white font-black text-sm py-3 rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Proceed to Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Authentication Required Modal */}
      <SignupDialog
        open={authRequiredOpen}
        onOpenChange={setAuthRequiredOpen}
        onSuccess={handleAuthSuccess}
        promptMessage={authPrompt}
        initialMode="login"
      />
    </main>
  );
}
