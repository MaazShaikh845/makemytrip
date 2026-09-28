"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Zap, TrendingUp, TrendingDown, Snowflake, Clock, ShieldCheck,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, X, BarChart2,
  RefreshCw, Info,
} from "lucide-react";
import {
  calculateDynamicPrice,
  generatePriceHistory,
  getActiveFreeze,
  createPriceFreeze,
  cancelPriceFreeze,
  getRemainingFreezeTime,
  FREEZE_PLANS,
  DynamicPriceResult,
  PriceFreeze,
  PriceHistoryPoint,
} from "@/lib/pricingEngine";
import PriceHistoryGraph from "@/components/PriceHistoryGraph";

interface Props {
  basePrice: number;
  bookingId: string;
  type: "flight" | "hotel";
  currency?: string;
  /** called whenever the effective price changes (for parent fare summary) */
  onPriceChange?: (effectivePrice: number, isFrozen: boolean) => void;
}

export default function DynamicPricePanel({ basePrice, bookingId, type, currency = "₹", onPriceChange }: Props) {
  const [pricing, setPricing] = useState<DynamicPriceResult | null>(null);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [freeze, setFreeze] = useState<PriceFreeze | null>(null);
  const [freezeTimer, setFreezeTimer] = useState({ hours: 0, minutes: 0, seconds: 0, percent: 100 });
  const [showFactors, setShowFactors] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showFreezePanel, setShowFreezePanel] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(FREEZE_PLANS[1]);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  // Refresh pricing
  const refreshPricing = useCallback(() => {
    const result = calculateDynamicPrice(basePrice, bookingId);
    setPricing(result);
    setPulse(true);
    setLastUpdate(new Date());
    setTimeout(() => setPulse(false), 800);
  }, [basePrice, bookingId]);

  // Load history on mount
  useEffect(() => {
    refreshPricing();
    setHistory(generatePriceHistory(basePrice, bookingId));
    const activeFreeze = getActiveFreeze(bookingId, type);
    setFreeze(activeFreeze);
  }, [basePrice, bookingId, type, refreshPricing]);

  // Auto-refresh every 15 minutes (simulated as 15s in demo)
  useEffect(() => {
    const interval = setInterval(refreshPricing, 15000);
    return () => clearInterval(interval);
  }, [refreshPricing]);

  // Freeze countdown ticker
  useEffect(() => {
    if (!freeze) return;
    const tick = () => {
      const t = getRemainingFreezeTime(freeze);
      setFreezeTimer(t);
      if (t.totalSeconds === 0) {
        setFreeze(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [freeze]);

  // Notify parent of effective price
  useEffect(() => {
    if (!pricing) return;
    const effectivePrice = freeze ? freeze.frozenPrice : pricing.dynamicPrice;
    onPriceChange?.(effectivePrice, !!freeze);
  }, [pricing, freeze, onPriceChange]);

  if (!pricing) return null;

  const effectivePrice = freeze ? freeze.frozenPrice : pricing.dynamicPrice;
  const isSurge = pricing.surgePercent > 0;
  const fmtPrice = (p: number) => `${currency}${p.toLocaleString("en-IN")}`;

  const handleCreateFreeze = () => {
    setFreezeLoading(true);
    setTimeout(() => {
      const newFreeze = createPriceFreeze(bookingId, type, pricing.dynamicPrice, basePrice, selectedPlan.hours);
      setFreeze(newFreeze);
      setFreezeLoading(false);
      setFreezeSuccess(true);
      setShowFreezePanel(false);
      setTimeout(() => setFreezeSuccess(false), 4000);
    }, 800);
  };

  const handleCancelFreeze = () => {
    cancelPriceFreeze(bookingId, type);
    setFreeze(null);
  };

  const factorColors: Record<string, string> = {
    red: "#DC2626",
    orange: "#C2410C",
    green: "#166534",
    blue: "#1D4ED8",
  };

  return (
    <div style={{
      background: "#FFFDF9",
      border: "1px solid #E6DDD0",
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      fontFamily: "inherit",
    }}>
      {/* ── Top live price bar ── */}
      <div style={{
        background: "linear-gradient(135deg, #F3EBDD 0%, #FAF6EF 100%)",
        padding: "16px 20px 14px",
        borderBottom: "1px solid #E6DDD0",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          {/* Price + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#C2410C", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Zap size={12} style={{ color: "#C2410C" }} />
                  Dynamic Price
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{
                  fontSize: 28, fontWeight: 900, color: "#1E293B",
                  transition: "all 0.3s",
                  transform: pulse ? "scale(1.03)" : "scale(1)",
                }}>
                  {fmtPrice(effectivePrice)}
                </span>
                {basePrice !== effectivePrice && (
                  <span style={{ fontSize: 13, color: "#786C60", textDecoration: "line-through" }}>
                    {fmtPrice(basePrice)}
                  </span>
                )}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                  background: isSurge ? "#FEE2E2" : "#DCFCE7",
                  border: isSurge ? "1px solid #FCA5A5" : "1px solid #86EFAC",
                  color: isSurge ? "#DC2626" : "#166534",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  {isSurge ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {isSurge ? `+${pricing.surgePercent}%` : `${pricing.surgePercent}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Demand meter */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#786C60", marginBottom: 4, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Demand Level
            </div>
            <div style={{
              fontSize: 13, fontWeight: 800, color: pricing.demandColor,
              display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: pricing.demandColor,
                boxShadow: `0 0 6px ${pricing.demandColor}`,
                display: "inline-block",
              }} />
              {pricing.demandLevel}
            </div>
            {/* Bar meter */}
            <div style={{ marginTop: 4, width: 85, height: 4, background: "#E6DDD0", borderRadius: 4, marginLeft: "auto" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: pricing.demandColor,
                width: `${Math.min(100, Math.max(15, (pricing.totalMultiplier - 0.8) / 0.8 * 100))}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        </div>

        {/* Freeze active banner */}
        {freeze && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 14,
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Snowflake size={16} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8" }}>Price Frozen at {fmtPrice(freeze.frozenPrice)}</span>
              <span style={{ fontSize: 11, color: "#475569" }}>
                · {freezeTimer.hours > 0 ? `${freezeTimer.hours}h ` : ""}{freezeTimer.minutes}m {String(freezeTimer.seconds).padStart(2, "0")}s remaining
              </span>
            </div>
            {/* Countdown arc */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", width: 34, height: 34 }}>
                <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: 34, height: 34 }}>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#DBEAFE" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#2563EB" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 15 * freezeTimer.percent / 100} ${2 * Math.PI * 15}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#1D4ED8" }}>
                  {freezeTimer.percent}%
                </span>
              </div>
              <button onClick={handleCancelFreeze} style={{
                background: "#FEE2E2", border: "1px solid #FCA5A5",
                borderRadius: 8, padding: "4px 10px", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Freeze success toast */}
        {freezeSuccess && (
          <div style={{
            marginTop: 10, padding: "8px 14px", borderRadius: 10,
            background: "#DCFCE7", border: "1px solid #86EFAC",
            display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#166534", fontWeight: 700,
          }}>
            <CheckCircle2 size={14} /> Price locked in successfully!
          </div>
        )}

        {/* Last update row */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: "#786C60", display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={10} />
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
          <button onClick={refreshPricing} style={{
            background: "transparent", border: "none", cursor: "pointer", fontSize: 10, color: "#C2410C",
            fontWeight: 700, display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 6,
          }}>
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Action buttons row ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #E6DDD0" }}>
        {[
          { label: "Why this price?", icon: <Info size={13} />, onClick: () => { setShowFactors(p => !p); setShowGraph(false); setShowFreezePanel(false); }, active: showFactors },
          { label: "Price History", icon: <BarChart2 size={13} />, onClick: () => { setShowGraph(p => !p); setShowFactors(false); setShowFreezePanel(false); }, active: showGraph },
          { label: freeze ? "Freeze Active" : "Freeze Price ❄", icon: <Snowflake size={13} />, onClick: () => { if (!freeze) { setShowFreezePanel(p => !p); setShowFactors(false); setShowGraph(false); } }, active: showFreezePanel, disabled: !!freeze },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            disabled={btn.disabled}
            style={{
              flex: 1, padding: "10px 4px", background: btn.active ? "#FFF1EB" : "transparent",
              border: "none", borderRight: i < 2 ? "1px solid #E6DDD0" : "none",
              color: btn.active ? "#C2410C" : btn.disabled ? "#A8A29E" : "#57534E",
              fontSize: 11, fontWeight: btn.active ? 800 : 600, cursor: btn.disabled ? "default" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              transition: "all 0.2s",
            }}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Factors breakdown ── */}
      {showFactors && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E6DDD0", background: "#FFFDF9" }}>
          <div style={{ fontSize: 12, color: "#1E293B", marginBottom: 12, fontWeight: 700 }}>
            Pricing Factors (×{pricing.totalMultiplier.toFixed(2)} total multiplier)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pricing.factors.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 12,
                background: "#FAF6EF", border: "1px solid #E6DDD0",
              }}>
                <span style={{ fontSize: 18 }}>{f.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: "#786C60", marginTop: 1 }}>{f.description}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 12,
                  background: f.multiplier > 1 ? "#FEE2E2" : "#DCFCE7",
                  border: f.multiplier > 1 ? "1px solid #FCA5A5" : "1px solid #86EFAC",
                  color: factorColors[f.color] || "#1E293B",
                  whiteSpace: "nowrap",
                }}>
                  {f.multiplier > 1 ? `+${Math.round((f.multiplier - 1) * 100)}%` : `${Math.round((f.multiplier - 1) * 100)}%`}
                </span>
              </div>
            ))}
          </div>
          {/* Base price note */}
          <div style={{
            marginTop: 12, padding: "8px 12px", borderRadius: 10,
            background: "#FFF1EB", border: "1px solid #FED7AA",
            fontSize: 11, color: "#9A3412",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <ShieldCheck size={14} style={{ color: "#C2410C" }} />
            Base fare: {fmtPrice(basePrice)} · Multiplier: ×{pricing.totalMultiplier.toFixed(2)} · Current: {fmtPrice(pricing.dynamicPrice)}
          </div>
        </div>
      )}

      {/* ── Price History Graph ── */}
      {showGraph && (
        <div style={{ padding: 14, borderBottom: "1px solid #E6DDD0", background: "#FAF6EF" }}>
          <PriceHistoryGraph
            history={history}
            frozenPrice={freeze?.frozenPrice ?? null}
            currency={currency}
            title={`Price History (30 Days)`}
            accentColor="#C2410C"
          />
        </div>
      )}

      {/* ── Freeze Panel ── */}
      {showFreezePanel && !freeze && (
        <div style={{ padding: "16px 20px", background: "#FFFDF9" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Snowflake size={15} style={{ color: "#2563EB" }} />
            Lock in Today's Price
          </div>
          <div style={{ fontSize: 11, color: "#786C60", marginBottom: 14 }}>
            Pay a small fee to freeze the current price. If the price goes up before you book, you still pay {fmtPrice(pricing.dynamicPrice)}.
          </div>

          {/* Surge warning */}
          {pricing.surgePercent > 10 && (
            <div style={{
              padding: "8px 12px", borderRadius: 10, marginBottom: 12,
              background: "#FFF7ED", border: "1px solid #FFEDD5",
              display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#C2410C", fontWeight: 600,
            }}>
              <AlertTriangle size={13} style={{ color: "#C2410C" }} />
              Price is currently {pricing.surgePercent}% above standard — freezing now secures this rate.
            </div>
          )}

          {/* Plan cards */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {FREEZE_PLANS.map((plan) => (
              <button
                key={plan.hours}
                onClick={() => setSelectedPlan(plan)}
                style={{
                  flex: 1, minWidth: 80, padding: "10px 8px", borderRadius: 14, cursor: "pointer",
                  border: selectedPlan.hours === plan.hours ? "2px solid #C2410C" : "1px solid #E6DDD0",
                  background: selectedPlan.hours === plan.hours ? "#FFF1EB" : "#FAF6EF",
                  color: "#1E293B", position: "relative", transition: "all 0.2s",
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
                    fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                    background: "#C2410C",
                    color: "#fff", whiteSpace: "nowrap",
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{plan.label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#C2410C" }}>{currency}{plan.fee}</div>
                <div style={{ fontSize: 9, color: "#786C60", marginTop: 2 }}>one-time fee</div>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div style={{
            padding: "10px 14px", borderRadius: 12, marginBottom: 12,
            background: "#FAF6EF", border: "1px solid #E6DDD0",
            fontSize: 11, color: "#57534E",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>Current price locked</span>
              <span style={{ fontWeight: 800, color: "#1E293B" }}>{fmtPrice(pricing.dynamicPrice)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Freeze fee ({selectedPlan.label})</span>
              <span style={{ fontWeight: 800, color: "#C2410C" }}>+{currency}{selectedPlan.fee}</span>
            </div>
          </div>

          <button
            onClick={handleCreateFreeze}
            disabled={freezeLoading}
            style={{
              width: "100%", padding: "12px", borderRadius: 14, border: "none",
              background: freezeLoading ? "#E6DDD0" : "#C2410C",
              color: "#fff", fontSize: 13, fontWeight: 800, cursor: freezeLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 12px rgba(194,65,12,0.25)",
              transition: "all 0.2s",
            }}
          >
            {freezeLoading ? (
              <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
            ) : (
              <><Snowflake size={14} /> Freeze Price for {currency}{selectedPlan.fee}</>
            )}
          </button>
        </div>
      )}

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
