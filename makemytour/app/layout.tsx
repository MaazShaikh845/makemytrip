import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MakeMyTour | Classic Travel & Vacation Booking Portal",
  description: "Discover exclusive flight deals, heritage hotels, and vintage travel packages with MakeMyTour.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF6EF] text-[#2C2623] relative selection:bg-orange-200 selection:text-orange-950">
        {/* Full-bleed scenic travel background image */}
        <div className="fixed inset-0 z-0 bg-[url('https://i.pinimg.com/736x/a5/0d/05/a50d05dd4ca9116119320a244c438c19.jpg')] bg-cover bg-center bg-no-repeat pointer-events-none" />
        
        {/* Balanced warm tone overlay ensuring the image is visible while cards and text stand out */}
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#FAF6EF]/60 via-[#FAF6EF]/50 to-[#FAF6EF]/75 pointer-events-none backdrop-blur-[1.5px]" />

        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          <Providers>
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
