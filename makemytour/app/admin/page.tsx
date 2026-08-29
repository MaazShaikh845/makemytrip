"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import FlightList from "@/components/Flights/Flightlist";
import HotelList from "@/components/Hotel/Hotel";
import {
  addflight,
  addhotel,
  editflight,
  edithotel,
  getuserbyemail,
} from "@/lib/api";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ShieldCheck, Lock, ArrowLeft, Search, UserCheck, Plane, Hotel } from "lucide-react";
import Link from "next/link";
import SignupDialog from "@/components/ui/SignupDialog";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string;
}

// ─── User Search ────────────────────────────────────────────────────────────────

function UserSearch() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUser(null);
    setSearchError(null);
    try {
      const data = await getuserbyemail(email);
      setUser(data);
    } catch (err: any) {
      setSearchError(err.message ?? "User not found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="email" className="sr-only">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Search passenger account by email..."
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSearchError(null); }}
            className="bg-[#FAF6EF] text-[#1E293B] placeholder-[#A89F91] border-[#E6DDD0] font-semibold"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold">
          <Search className="w-4 h-4 mr-1.5" />
          <span>{loading ? "Searching..." : "Lookup"}</span>
        </Button>
      </form>

      {searchError && (
        <div className="p-3 bg-[#BE123C]/10 border border-[#BE123C]/30 rounded-xl text-[#BE123C] text-xs font-semibold flex items-center space-x-2">
          <span>⚠️</span>
          <span>{searchError}</span>
        </div>
      )}

      {user && (
        <div className="border border-[#E6DDD0] p-5 rounded-2xl bg-[#FAF6EF] space-y-2">
          <h3 className="font-bold text-[#1E293B] text-base flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-[#047857]" />
            <span>Passenger Record</span>
          </h3>
          <p className="text-xs text-[#57534E]">
            <strong className="text-[#1E293B]">Name:</strong> {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-[#57534E]">
            <strong className="text-[#1E293B]">Email:</strong> {user.email}
          </p>
          <p className="text-xs text-[#57534E]">
            <strong className="text-[#1E293B]">Access Role:</strong>{" "}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30">
              {user.role}
            </span>
          </p>
          <p className="text-xs text-[#57534E]">
            <strong className="text-[#1E293B]">Telephone:</strong> {user.phoneNumber || "N/A"}
          </p>
        </div>
      )}
    </div>
  );
}


// ─── Hotel Form ─────────────────────────────────────────────────────────────────

interface HotelData {
  id?: string;
  name: string;
  city: string;
  address: string;
  pricePerNight: number;
  availableRooms: number;
  amenities: string;
  starRating: number;
}

const emptyHotel: HotelData = {
  name: "",
  city: "",
  address: "",
  pricePerNight: 0,
  availableRooms: 0,
  amenities: "",
  starRating: 3,
};

function AddEditHotel({ hotel, onSaved }: { hotel: HotelData | null; onSaved?: () => void }) {
  const [formData, setFormData] = useState<HotelData>(emptyHotel);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    setFormData(hotel ? { ...hotel } : emptyHotel);
    setMessage(null);
  }, [hotel]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (hotel?.id) {
        await edithotel(
          userId,
          hotel.id,
          formData.name,
          formData.city,
          formData.address,
          Number(formData.pricePerNight),
          Number(formData.starRating),
          Number(formData.availableRooms),
          formData.amenities
        );
        setMessage("✅ Hotel record updated successfully.");
      } else {
        await addhotel(
          userId,
          formData.name,
          formData.city,
          formData.address,
          Number(formData.pricePerNight),
          Number(formData.starRating),
          Number(formData.availableRooms),
          formData.amenities
        );
        setFormData(emptyHotel);
        setMessage("✅ Hotel added successfully.");
      }
      onSaved?.();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.message || err.message || "Failed to save hotel."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 bg-[#FAF6EF] p-5 rounded-2xl border border-[#E6DDD0]">
      <h3 className="text-base font-bold text-[#1E293B] mb-2 flex items-center space-x-2">
        <Hotel className="w-4 h-4 text-[#C2410C]" />
        <span>{hotel ? "Edit Property Record" : "Add New Hotel Property"}</span>
      </h3>

      <div>
        <Label htmlFor="name" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Hotel Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange}
          className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="city" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
        <div>
          <Label htmlFor="starRating" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Star Rating (1–5)</Label>
          <Input id="starRating" name="starRating" type="number" min={1} max={5}
            value={formData.starRating} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Address & Landmark</Label>
        <Input id="address" name="address" value={formData.address} onChange={handleChange}
          className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pricePerNight" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Tariff Per Night (₹)</Label>
          <Input id="pricePerNight" name="pricePerNight" type="number"
            value={formData.pricePerNight} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
        <div>
          <Label htmlFor="availableRooms" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Available Rooms</Label>
          <Input id="availableRooms" name="availableRooms" type="number"
            value={formData.availableRooms} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
      </div>

      <div>
        <Label htmlFor="amenities" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Amenities & Features</Label>
        <Textarea id="amenities" name="amenities" value={formData.amenities} onChange={handleChange}
          className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" />
      </div>

      {message && (
        <p className={`text-xs font-bold ${message.startsWith("✅") ? "text-[#047857]" : "text-[#BE123C]"}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}
        className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold cursor-pointer">
        {saving ? "Saving…" : hotel ? "Update Hotel Record" : "Add Hotel Property"}
      </Button>
    </form>
  );
}

// ─── Flight Form ────────────────────────────────────────────────────────────────

interface FlightData {
  id?: string;
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
}

const emptyFlight: FlightData = {
  airline: "",
  flightNumber: "",
  origin: "",
  destination: "",
  departureTime: "",
  arrivalTime: "",
  price: 0,
  availableSeats: 0,
  classType: "ECONOMY",
  durationMinutes: 0,
};

function AddEditFlight({ flight, onSaved }: { flight: FlightData | null; onSaved?: () => void }) {
  const [formData, setFormData] = useState<FlightData>(emptyFlight);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  useEffect(() => {
    setFormData(flight ? { ...flight } : emptyFlight);
    setMessage(null);
  }, [flight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (flight?.id) {
        await editflight(
          userId,
          flight.id,
          formData.airline,
          formData.flightNumber,
          formData.origin,
          formData.destination,
          formData.departureTime,
          formData.arrivalTime,
          Number(formData.price),
          Number(formData.availableSeats),
          formData.classType,
          Number(formData.durationMinutes)
        );
        setMessage("✅ Flight schedule updated successfully.");
      } else {
        await addflight(
          userId,
          formData.airline,
          formData.flightNumber,
          formData.origin,
          formData.destination,
          formData.departureTime,
          formData.arrivalTime,
          Number(formData.price),
          Number(formData.availableSeats),
          formData.classType,
          Number(formData.durationMinutes)
        );
        setFormData(emptyFlight);
        setMessage("✅ Flight schedule added successfully.");
      }
      onSaved?.();
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.message || err.message || "Failed to save flight."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 bg-[#FAF6EF] p-5 rounded-2xl border border-[#E6DDD0]">
      <h3 className="text-base font-bold text-[#1E293B] mb-2 flex items-center space-x-2">
        <Plane className="w-4 h-4 text-[#C2410C]" />
        <span>{flight ? "Edit Carrier Schedule" : "Add New Flight Schedule"}</span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="airline" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Carrier Airline</Label>
          <Input id="airline" name="airline" value={formData.airline} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
        <div>
          <Label htmlFor="flightNumber" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Flight Number</Label>
          <Input id="flightNumber" name="flightNumber" value={formData.flightNumber} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="origin" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Origin (IATA Code)</Label>
          <Input id="origin" name="origin" value={formData.origin} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" placeholder="e.g. DEL" required />
        </div>
        <div>
          <Label htmlFor="destination" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Destination (IATA Code)</Label>
          <Input id="destination" name="destination" value={formData.destination} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" placeholder="e.g. BOM" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="departureTime" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Departure Timetable</Label>
          <Input id="departureTime" name="departureTime" type="datetime-local"
            value={formData.departureTime} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
        <div>
          <Label htmlFor="arrivalTime" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Arrival Timetable</Label>
          <Input id="arrivalTime" name="arrivalTime" type="datetime-local"
            value={formData.arrivalTime} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="price" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Base Tariff (₹)</Label>
          <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
        <div>
          <Label htmlFor="availableSeats" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Seats Available</Label>
          <Input id="availableSeats" name="availableSeats" type="number"
            value={formData.availableSeats} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
        <div>
          <Label htmlFor="durationMinutes" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Flight Min.</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number"
            value={formData.durationMinutes} onChange={handleChange}
            className="bg-[#FFFDF9] text-[#1E293B] border-[#E6DDD0] font-semibold" required />
        </div>
      </div>

      <div>
        <Label htmlFor="classType" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">Cabin Class</Label>
        <select id="classType" name="classType" value={formData.classType} onChange={handleChange}
          className="w-full mt-1 h-9 rounded-md bg-[#FFFDF9] text-[#1E293B] border border-[#E6DDD0] px-3 text-xs font-bold focus:outline-none focus:border-[#C2410C]">
          <option value="ECONOMY">Economy Class</option>
          <option value="BUSINESS">Business Class</option>
          <option value="FIRST">First Class</option>
        </select>
      </div>

      {message && (
        <p className={`text-xs font-bold ${message.startsWith("✅") ? "text-[#047857]" : "text-[#BE123C]"}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={saving}
        className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold cursor-pointer">
        {saving ? "Saving…" : flight ? "Update Flight Schedule" : "Add Flight Schedule"}
      </Button>
    </form>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState("flights");
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [flightRefresh, setFlightRefresh] = useState(0);
  const [hotelRefresh, setHotelRefresh] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a neutral skeleton while hydrating to avoid SSR/client mismatch
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex-1 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#C2410C] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Role Protection Guard (client-only, no SSR mismatch)
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex-1 flex flex-col justify-center items-center text-center">
        <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-3xl p-8 sm:p-12 shadow-md max-w-md w-full">
          <div className="w-16 h-16 bg-[#BE123C]/10 text-[#BE123C] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#BE123C]/30">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#1E293B] mb-2">Station Master Authorization Required</h1>
          <p className="text-[#786C60] text-xs mb-6">
            You must be authenticated with an administrator role to manage flight and hotel manifests.
          </p>
          <div className="flex flex-col space-y-3">
            <SignupDialog
              trigger={
                <Button className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold py-2.5 rounded-xl shadow-xs">
                  Sign In as Administrator
                </Button>
              }
            />
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 text-[#786C60] hover:text-[#1E293B] text-xs font-bold transition-colors pt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Station Master Console</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-tight">Admin & Carrier Control</h1>
        </div>

        <Link
          href="/"
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#FFFDF9] hover:bg-[#FAF6EF] text-[#1E293B] border border-[#E6DDD0] text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#C2410C]" />
          <span>Back to Storefront</span>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#F3EBDD] border border-[#E6DDD0]">
          <TabsTrigger value="flights">Flight Schedules</TabsTrigger>
          <TabsTrigger value="hotels">Hotel Properties</TabsTrigger>
          <TabsTrigger value="users">Passenger Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="flights">
          <Card>
            <CardHeader>
              <CardTitle>Manage Air Schedules</CardTitle>
              <CardDescription>Add, update, or adjust carrier routes and base tariffs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FlightList
                  key={flightRefresh}
                  onSelect={(f) => setSelectedFlight(f)}
                />
                <AddEditFlight
                  flight={selectedFlight}
                  onSaved={() => {
                    setFlightRefresh((r) => r + 1);
                    setSelectedFlight(null);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels">
          <Card>
            <CardHeader>
              <CardTitle>Manage Hotel Inventory</CardTitle>
              <CardDescription>Configure registered hotel accommodations and tariffs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HotelList
                  key={hotelRefresh}
                  onSelect={(h) => setSelectedHotel(h)}
                />
                <AddEditHotel
                  hotel={selectedHotel}
                  onSaved={() => {
                    setHotelRefresh((r) => r + 1);
                    setSelectedHotel(null);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Passenger Registry</CardTitle>
              <CardDescription>Query registered accounts by electronic email.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearch />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
