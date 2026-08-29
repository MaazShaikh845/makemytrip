"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Label } from "./label";
import { Input } from "./input";
import { signup, login } from "@/lib/api";
import { setUser } from "@/store";
import { useDispatch } from "react-redux";
import { Award, Lock } from "lucide-react";

interface SignupDialogProps {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (user: any) => void;
  initialMode?: "login" | "signup";
  promptMessage?: string;
}

const SignupDialog: React.FC<SignupDialogProps> = ({
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
  initialMode = "signup",
  promptMessage,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsSignup(initialMode === "signup");
  }, [initialMode]);

  const handleOpenChange = (val: boolean) => {
    if (isControlled) {
      setControlledOpen?.(val);
    } else {
      setInternalOpen(val);
    }
    if (!val) setErrorMessage(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (isSignup) {
      try {
        const signin = await signup(
          firstName,
          lastName,
          phoneNumber,
          email,
          password
        );
        dispatch(setUser(signin));
        localStorage.setItem("authUser", JSON.stringify(signin));
        handleOpenChange(false);
        clearform();
        onSuccess?.(signin);
      } catch (error: any) {
        console.error("Signup error:", error);
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create account. Please try again.";
        setErrorMessage(msg);
      }
    } else {
      try {
        const data = await login(email, password);
        dispatch(setUser(data));
        localStorage.setItem("authUser", JSON.stringify(data));
        handleOpenChange(false);
        clearform();
        onSuccess?.(data);
      } catch (error: any) {
        console.error("Login error:", error);
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          (error.response?.status === 401
            ? "Invalid email or password"
            : "Failed to login. Please check your connection and credentials.");
        setErrorMessage(msg);
      }
    }
  };

  const clearform = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setErrorMessage(null);
  };

  const toggleMode = (signupMode: boolean) => {
    setIsSignup(signupMode);
    setErrorMessage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] bg-[#FFFDF9] text-[#1E293B] border border-[#E6DDD0] shadow-2xl rounded-2xl p-6">
        <DialogHeader>
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-[#C2410C] uppercase tracking-widest mb-1">
            <Award className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>MakeMyTour Passenger Portal</span>
          </div>
          <DialogTitle className="text-2xl font-black text-[#1E293B]">
            {isSignup ? "Create Passenger Account" : "Sign In to Continue"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#786C60] mt-1">
            {promptMessage ||
              (isSignup
                ? "Register to reserve flights, hotels, and receive instant booking itineraries."
                : "Please authenticate with your email credentials to access or reserve bookings.")}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 text-xs text-[#BE123C] bg-[#BE123C]/10 rounded-xl border border-[#BE123C]/30 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 py-2">
          {isSignup && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] placeholder-[#A89F91] focus:border-[#C2410C] focus:ring-[#C2410C] font-semibold rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] placeholder-[#A89F91] focus:border-[#C2410C] focus:ring-[#C2410C] font-semibold rounded-xl"
                  required
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="passenger@example.com"
              className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] placeholder-[#A89F91] focus:border-[#C2410C] focus:ring-[#C2410C] font-semibold rounded-xl"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] placeholder-[#A89F91] focus:border-[#C2410C] focus:ring-[#C2410C] font-semibold rounded-xl"
              required
            />
          </div>
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-[#57534E] text-xs font-bold uppercase tracking-wide">
                Telephone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-[#FAF6EF] text-[#1E293B] border-[#E6DDD0] placeholder-[#A89F91] focus:border-[#C2410C] focus:ring-[#C2410C] font-semibold rounded-xl"
                required
              />
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold py-2.5 rounded-xl shadow-xs border border-[#9A3412] transition-all mt-2 cursor-pointer"
          >
            {isSignup ? "Register & Continue" : "Sign In & Proceed"}
          </Button>
        </form>
        <div className="text-center text-xs text-[#786C60] mt-2">
          {isSignup ? (
            <>
              Already registered?{" "}
              <button
                type="button"
                className="text-[#C2410C] hover:underline font-bold text-xs ml-1 cursor-pointer"
                onClick={() => toggleMode(false)}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Need a passenger account?{" "}
              <button
                type="button"
                className="text-[#C2410C] hover:underline font-bold text-xs ml-1 cursor-pointer"
                onClick={() => toggleMode(true)}
              >
                Register Here
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;