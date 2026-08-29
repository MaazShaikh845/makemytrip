"use client";

import React from "react";
import SignupDialog from "@/components/ui/SignupDialog";
import { Button } from "@/components/ui/button";
import { Plane, LogOut, ShieldCheck } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, clearUser } from "@/store";
import Link from "next/link";

export default function Navbar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    dispatch(clearUser());
  };

  const userInitial = user
    ? (user.firstName
        ? user.firstName.trim().charAt(0)
        : user.email
        ? user.email.trim().charAt(0)
        : "U"
      ).toUpperCase()
    : "U";

  const userDisplayName = user
    ? (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email)
    : "";

  return (
    <header className="bg-[#FFFDF9]/80 backdrop-blur-xl border-b border-[#E6DDD0]/80 sticky top-0 z-50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
          <div className="bg-[#C2410C] text-white p-2 rounded-xl shadow-xs border border-[#9A3412] group-hover:scale-105 transition-transform flex items-center justify-center">
            <Plane className="w-5 h-5 transform -rotate-12" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1E293B] font-sans">
              MakeMy<span className="text-[#C2410C]">Tour</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#786C60] -mt-1">
              Est. 2000 • Travel Co.
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2.5">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#047857]/10 text-[#047857] border border-[#047857]/30 hover:bg-[#047857]/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                href="/profile"
                title={`Profile: ${userDisplayName}`}
                className="w-9 h-9 rounded-full bg-[#1E293B] text-amber-50 font-bold text-sm flex items-center justify-center shadow-xs border border-[#334155] hover:ring-2 hover:ring-[#C2410C] hover:scale-105 transition-all cursor-pointer"
              >
                {userInitial}
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-[#E6DDD0] text-[#57534E] hover:bg-[#F3EBDD] hover:text-[#1E293B] font-medium bg-[#FFFDF9]/70"
              >
                <LogOut className="w-4 h-4 mr-1.5 text-[#C2410C]" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <SignupDialog
              trigger={
                <Button
                  size="sm"
                  className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold px-4 py-2 rounded-xl shadow-xs border border-[#9A3412] transition-all cursor-pointer"
                >
                  <span>Login / Register</span>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </header>
  );
}
