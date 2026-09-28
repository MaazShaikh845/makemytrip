// makemytour/components/ui/FlightStatusToast.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  ExternalLink,
  Plane,
} from "lucide-react";
import { notificationService, InAppNotification } from "@/lib/notificationService";
import Link from "next/link";

interface ToastItem extends InAppNotification {
  visible: boolean;
  exiting: boolean;
}

const TOAST_DURATION_MS = 6000;
const MAX_VISIBLE_TOASTS = 4;

export default function FlightStatusToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350);
  }, []);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToToasts((item) => {
      const toastItem: ToastItem = { ...item, visible: false, exiting: false };
      setToasts((prev) => {
        const next = [toastItem, ...prev].slice(0, MAX_VISIBLE_TOASTS);
        return next;
      });
      // Trigger visible animation
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, visible: true } : t))
        );
      }, 30);
      // Auto-dismiss after TOAST_DURATION_MS
      setTimeout(() => removeToast(item.id), TOAST_DURATION_MS);
    });
    return () => unsubscribe();
  }, [removeToast]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "WARNING":
        return {
          border: "border-amber-400",
          bg: "bg-amber-50",
          bar: "bg-amber-400",
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          label: "text-amber-800",
        };
      case "SUCCESS":
        return {
          border: "border-emerald-400",
          bg: "bg-emerald-50",
          bar: "bg-emerald-400",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
          label: "text-emerald-800",
        };
      case "CRITICAL":
        return {
          border: "border-rose-500",
          bg: "bg-rose-50",
          bar: "bg-rose-500",
          icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
          label: "text-rose-800",
        };
      case "INFO":
      default:
        return {
          border: "border-sky-400",
          bg: "bg-sky-50",
          bar: "bg-sky-400",
          icon: <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />,
          label: "text-sky-800",
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-4 sm:right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Flight status notifications"
    >
      {toasts.map((toast) => {
        const style = getSeverityStyle(toast.severity);
        return (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto w-80 sm:w-96 rounded-2xl border-l-4 shadow-xl
              ${style.border} ${style.bg}
              transition-all duration-350 ease-out
              ${toast.visible && !toast.exiting
                ? "opacity-100 translate-y-0 scale-100"
                : toast.exiting
                ? "opacity-0 translate-y-4 scale-95"
                : "opacity-0 translate-y-6 scale-95"
              }
            `}
            style={{ transitionProperty: "opacity, transform" }}
          >
            {/* Progress bar auto-dismiss indicator */}
            <div className="relative h-1 rounded-tl-2xl overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full ${style.bar} rounded-tl-2xl`}
                style={{
                  animation: `toast-progress ${TOAST_DURATION_MS}ms linear forwards`,
                }}
              />
            </div>

            <div className="p-3.5">
              <div className="flex items-start gap-3">
                {/* Severity icon */}
                <div className="mt-0.5">
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Plane className="w-3 h-3 text-[#C2410C]" />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${style.label}`}>
                        {toast.severity === "CRITICAL"
                          ? "CRITICAL ALERT"
                          : toast.severity === "WARNING"
                          ? "DELAY ALERT"
                          : toast.severity === "SUCCESS"
                          ? "STATUS UPDATE"
                          : "FLIGHT INFO"}
                      </span>
                    </div>
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="p-0.5 rounded text-[#786C60] hover:text-[#1E293B] hover:bg-black/5 transition-colors cursor-pointer"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-black text-[#1E293B] leading-snug">
                    {toast.title}
                  </p>

                  {/* Message */}
                  <p className="text-xs text-[#57534E] mt-0.5 leading-relaxed line-clamp-2">
                    {toast.message}
                  </p>

                  {/* Delay context chip */}
                  {toast.delayReason && (
                    <p className="text-[10px] mt-1.5 text-[#786C60] italic line-clamp-1">
                      {toast.delayReason}
                    </p>
                  )}

                  {/* Footer row */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded bg-white/70 border border-[#E6DDD0] font-mono font-bold text-[10px] text-[#1E293B]">
                      {toast.flightNumber}
                    </span>
                    {toast.flightNumber !== "SYSTEM" && (
                      <Link
                        href={`/tracker?flight=${toast.flightNumber}`}
                        className="flex items-center gap-0.5 text-[10px] font-bold text-[#C2410C] hover:text-[#9A3412] hover:underline transition-colors"
                      >
                        <span>Track Live</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Keyframe animation for auto-dismiss progress bar */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
}
