"use client";

import React from "react";
import { Plane, Award, ShieldCheck, Headphones, MapPin, Mail, Phone, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#FFFDF9]/90 backdrop-blur-xl text-[#57534E] pt-12 pb-8 border-t border-[#E6DDD0] mt-auto z-10 relative shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Badges Section - Matching Rest of Page */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 pb-8 border-b border-[#E6DDD0]">
          <div className="bg-[#FAF6EF]/90 border border-[#E6DDD0] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2.5">
                <div className="bg-[#C2410C] text-white p-2 rounded-xl shadow-xs border border-[#9A3412] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Trusted Booking Heritage
                  </h3>
                  <span className="text-[10px] text-[#786C60] font-medium uppercase tracking-wider block">
                    Established in 2000
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#786C60] leading-relaxed">
                Over 25 years of transparent airfares, direct carrier relationships, and instant electronic ticketing.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E6DDD0] flex items-center justify-between text-[11px] font-bold text-[#C2410C]">
              <span>Verified Carrier Tariffs</span>
              <span>✓ Guaranteed</span>
            </div>
          </div>

          <div className="bg-[#FAF6EF]/90 border border-[#E6DDD0] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2.5">
                <div className="bg-[#1E293B] text-amber-50 p-2 rounded-xl shadow-xs border border-[#334155] flex items-center justify-center">
                  <Plane className="w-4 h-4 transform -rotate-12 text-[#C2410C]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Direct Airline Network
                  </h3>
                  <span className="text-[10px] text-[#786C60] font-medium uppercase tracking-wider block">
                    500+ Daily Routes
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#786C60] leading-relaxed">
                Connect seamlessly to all primary domestic airports and premier international destinations with live seat booking.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E6DDD0] flex items-center justify-between text-[11px] font-bold text-[#1E293B]">
              <span>Real-Time Flight Schedules</span>
              <span>✓ Live</span>
            </div>
          </div>

          <div className="bg-[#FAF6EF]/90 border border-[#E6DDD0] p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2.5">
                <div className="bg-[#047857] text-white p-2 rounded-xl shadow-xs border border-[#065F46] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Passenger Protection
                  </h3>
                  <span className="text-[10px] text-[#786C60] font-medium uppercase tracking-wider block">
                    24/7 Helpline Support
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#786C60] leading-relaxed">
                Every ticket and hotel reservation is backed by our instant verification system with dedicated support.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E6DDD0] flex items-center justify-between text-[11px] font-bold text-[#047857]">
              <span>Instant E-Ticket Delivery</span>
              <span>✓ Protected</span>
            </div>
          </div>
        </div>

        {/* Quick Links Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-xs">
          <div>
            <h4 className="font-bold text-[#1E293B] uppercase tracking-wider mb-3 text-xs flex items-center space-x-1.5">
              <Plane className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Flight Bookings</span>
            </h4>
            <ul className="space-y-2 font-medium text-[#57534E]">
              <li>
                <Link href="/" className="hover:text-[#C2410C] transition-colors">
                  Domestic Flights
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#C2410C] transition-colors">
                  International Routes
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#C2410C] transition-colors">
                  Flight Schedule Timetable
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#C2410C] transition-colors">
                  Baggage & Tariff Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#1E293B] uppercase tracking-wider mb-3 text-xs flex items-center space-x-1.5">
              <span className="text-[#C2410C]">🏨</span>
              <span>Heritage Stays</span>
            </h4>
            <ul className="space-y-2 font-medium text-[#57534E]">
              <li>
                <Link href="#hotels" className="hover:text-[#C2410C] transition-colors">
                  Heritage Hotels & Forts
                </Link>
              </li>
              <li>
                <Link href="#hotels" className="hover:text-[#C2410C] transition-colors">
                  Boutique Suites & Villas
                </Link>
              </li>
              <li>
                <Link href="#hotels" className="hover:text-[#C2410C] transition-colors">
                  Hill Station Lodges
                </Link>
              </li>
              <li>
                <Link href="#hotels" className="hover:text-[#C2410C] transition-colors">
                  Beachfront Resorts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#1E293B] uppercase tracking-wider mb-3 text-xs flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Curated Tours</span>
            </h4>
            <ul className="space-y-2 font-medium text-[#57534E]">
              <li>
                <Link href="#tours" className="hover:text-[#C2410C] transition-colors">
                  Rajasthan Royal Circuit
                </Link>
              </li>
              <li>
                <Link href="#tours" className="hover:text-[#C2410C] transition-colors">
                  Kerala Backwaters Cruise
                </Link>
              </li>
              <li>
                <Link href="#tours" className="hover:text-[#C2410C] transition-colors">
                  Dubai Skyline & Desert
                </Link>
              </li>
              <li>
                <Link href="#tours" className="hover:text-[#C2410C] transition-colors">
                  Himalayan Escapes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#1E293B] uppercase tracking-wider mb-3 text-xs flex items-center space-x-1.5">
              <Headphones className="w-3.5 h-3.5 text-[#C2410C]" />
              <span>Contact & Admin</span>
            </h4>
            <ul className="space-y-2 font-medium text-[#57534E]">
              <li className="flex items-center space-x-1.5">
                <Phone className="w-3 h-3 text-[#C2410C]" />
                <span className="text-[#1E293B] font-bold">+91 11 2345 6789</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Mail className="w-3 h-3 text-[#C2410C]" />
                <span className="text-[#57534E]">desk@makemytour.com</span>
              </li>
              <li className="pt-1">
                <Link href="/admin" className="text-[#C2410C] hover:underline font-bold inline-flex items-center space-x-1">
                  <span>Station Master Admin Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Vintage Stamp & Copyright */}
        <div className="pt-6 border-t border-[#E6DDD0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#786C60]">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded border border-[#D48B68] text-[#C2410C] font-mono font-bold text-[10px] uppercase bg-[#FAF6EF]">
              REGISTERED CO.
            </span>
            <span>© 2000 - 2026 MakeMyTour Ltd. All rights reserved.</span>
          </div>
          <div className="flex space-x-4 text-xs text-[#786C60]">
            <Link href="/" className="hover:text-[#C2410C] transition-colors">
              Terms of Carriage
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[#C2410C] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[#C2410C] transition-colors">
              Passenger Rights
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
