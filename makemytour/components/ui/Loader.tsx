import { Loader2, Plane } from "lucide-react";
import React from "react";

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  message = "Loading Travel Itinerary…",
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "min-h-[60vh] h-screen" : "py-12"
      } w-full`}
    >
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer rotating vintage ring */}
        <Loader2 className="animate-spin w-14 h-14 text-[#C2410C]" />
        {/* Center airplane icon */}
        <Plane className="w-5 h-5 text-[#1E293B] absolute transform -rotate-45" />
      </div>

      <p className="text-sm font-bold text-[#1E293B] tracking-wide">
        {message}
      </p>
      <span className="text-[10px] text-[#786C60] font-mono uppercase tracking-widest mt-1">
        MakeMyTour Express
      </span>
    </div>
  );
};

export default Loader;
