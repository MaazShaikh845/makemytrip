"use client";

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, setUser, clearUser } from "@/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Edit2,
  LogOut,
  Plane,
  Hotel,
  Calendar,
  MapPin,
  CreditCard,
  Loader2,
  Package,
} from "lucide-react";
import { getMyBookings, updateUserProfile } from "@/lib/api";
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

export default function ProfilePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchBookings = async (userId: string) => {
    setLoadingBookings(true);
    try {
      const data = await getMyBookings(userId);
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchBookings(user.id);
      setEditFirstName(user.firstName || "");
      setEditLastName(user.lastName || "");
      setEditPhone(user.phoneNumber || "");
    } else {
      setLoadingBookings(false);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    dispatch(clearUser());
    router.push("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const updatedUser = await updateUserProfile(
        user.id,
        editFirstName.trim(),
        editLastName.trim(),
        editPhone.trim()
      );
      dispatch(
        setUser({
          ...user,
          firstName: updatedUser.firstName || editFirstName.trim(),
          lastName: updatedUser.lastName || editLastName.trim(),
          phoneNumber: updatedUser.phoneNumber || editPhone.trim(),
        })
      );
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          ...user,
          firstName: updatedUser.firstName || editFirstName.trim(),
          lastName: updatedUser.lastName || editLastName.trim(),
          phoneNumber: updatedUser.phoneNumber || editPhone.trim(),
        })
      );
      setEditModalOpen(false);
    } catch (err: any) {
      setUpdateError(err?.response?.data?.message || err?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "28 Jan 2025";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "28 Jan 2025";
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#F8F9FA]/60">
        <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
          <User className="w-12 h-12 text-[#C2410C] mx-auto mb-3" />
          <h2 className="text-xl font-black text-[#1E293B] mb-1">User Profile</h2>
          <p className="text-xs text-stone-500 mb-6">
            Please login or register to view your profile and travel bookings.
          </p>
          <SignupDialog
            trigger={
              <Button className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold py-2.5 rounded-xl">
                Login / Register
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

  return (
    <div className="min-h-screen bg-[#F8F9FA]/80 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200/80 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-900">Profile</h2>
              <button
                type="button"
                onClick={() => {
                  setEditFirstName(user.firstName || "");
                  setEditLastName(user.lastName || "");
                  setEditPhone(user.phoneNumber || "");
                  setEditModalOpen(true);
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#C2410C] hover:text-[#9A3412] hover:underline cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-4 pt-1 text-sm text-stone-700">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <span className="font-medium text-stone-800">{fullName}</span>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <span className="font-medium text-stone-800 break-all">{user.email}</span>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-stone-500 flex-shrink-0" />
                <span className="font-medium text-stone-800">
                  {user.phoneNumber || "Not provided"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center space-x-2 text-sm font-semibold text-[#C2410C] hover:text-[#9A3412] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 transform rotate-180" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-stone-200/80 space-y-5">
            <h2 className="text-xl font-bold text-stone-900">My Bookings</h2>

            {loadingBookings ? (
              <div className="py-14 flex flex-col items-center justify-center space-y-2 text-stone-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#C2410C]" />
                <p className="text-xs font-medium">Loading your bookings…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 space-y-3">
                <Package className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-semibold text-stone-700">No bookings yet</p>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  When you book flights or hotels, your reservations will appear here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs shadow-xs transition-colors mt-2"
                >
                  Explore Flights &amp; Hotels
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const isFlight = booking.type === "FLIGHT";
                  const typeLabel = isFlight ? "Flight" : "Hotel";
                  const bookingIdDisplay = booking.id || booking.resourceId || "N/A";
                  const priceDisplay = Number(booking.totalPrice || 0).toLocaleString("en-IN");
                  const locationDisplay =
                    booking.resourceDetails?.split("|")[0]?.trim() || typeLabel;

                  return (
                    <div
                      key={booking.id || Math.random()}
                      className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-xs hover:border-stone-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600">
                            {isFlight ? (
                              <Plane className="w-5 h-5 transform -rotate-12" />
                            ) : (
                              <Hotel className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                              {typeLabel}
                            </h3>
                            <p className="text-xs text-stone-500 font-mono mt-0.5">
                              Booking ID: {bookingIdDisplay}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-base sm:text-lg font-bold text-stone-900 block">
                            ₹ {priceDisplay}
                          </span>
                          <span className="text-xs text-stone-400 capitalize block -mt-0.5">
                            {typeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatDate(booking.bookedAt)}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span className="truncate max-w-[200px]">{locationDisplay}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-medium text-stone-700">
                            {booking.status === "CANCELLED" ? "Cancelled" : "Paid"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-white border border-stone-200 text-stone-900 p-6 rounded-2xl shadow-xl">
          <DialogHeader className="pb-2 border-b border-stone-100">
            <DialogTitle className="text-lg font-bold text-stone-900">
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Update your personal contact details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            {updateError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {updateError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">First Name</Label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                  className="bg-stone-50 border-stone-300 text-xs rounded-xl h-9"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Last Name</Label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                  className="bg-stone-50 border-stone-300 text-xs rounded-xl h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Phone Number</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Phone number"
                className="bg-stone-50 border-stone-300 text-xs rounded-xl h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Email (Read Only)</Label>
              <Input
                readOnly
                disabled
                value={user.email}
                className="bg-stone-100 border-stone-200 text-stone-500 text-xs rounded-xl h-9 cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold rounded-xl"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
