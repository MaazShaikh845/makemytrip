"use client";
import React, { useState, useRef, useCallback } from "react";
import { PriceHistoryPoint } from "@/lib/pricingEngine";
import { TrendingUp, TrendingDown, Minus, Snowflake } from "lucide-react";

interface Props {
  history: PriceHistoryPoint[];
  frozenPrice?: number | null;
  currency?: string;
  title?: string;
  accentColor?: string;
}

export default function PriceHistoryGraph({
  history,
  frozenPrice,
  currency = "₹",
  title = "Price History (30 Days)",
  accentColor = "#C2410C",
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: PriceHistoryPoint } | null>(null);
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30>(30);

  const displayed = history.slice(-selectedRange);

  if (!displayed.length) return null;

  const prices = displayed.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const todayPoint = displayed.find((p) => p.isToday);
  const prevPrice = displayed.length >= 2 ? displayed[displayed.length - 2].price : displayed[0].price;
  const todayPrice = todayPoint?.price ?? prices[prices.length - 1];
  const trend = todayPrice > prevPrice ? "up" : todayPrice < prevPrice ? "down" : "flat";

  // SVG dimensions
  const W = 700;
  const H = 200;
  const PAD_L = 60;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const toX = (i: number) => PAD_L + (i / (displayed.length - 1)) * chartW;
  const toY = (price: number) => PAD_T + chartH - ((price - minPrice) / priceRange) * chartH;

  // Build SVG path
  const linePath = displayed.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.price).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${toX(displayed.length - 1).toFixed(1)} ${(PAD_T + chartH).toFixed(1)} L ${PAD_L.toFixed(1)} ${(PAD_T + chartH).toFixed(1)} Z`;

  // Price grid lines (4 y-levels)
  const gridLevels = [0, 0.33, 0.66, 1.0].map((frac) => ({
    y: PAD_T + chartH - frac * chartH,
    price: minPrice + frac * priceRange,
  }));

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const relX = svgX - PAD_L;
      const idx = Math.round((relX / chartW) * (displayed.length - 1));
      const clamped = Math.max(0, Math.min(displayed.length - 1, idx));
      setTooltip({ x: toX(clamped), y: toY(displayed[clamped].price), point: displayed[clamped] });
    },
    [displayed, chartW]
  );

  const formatPrice = (p: number) => `${currency}${p.toLocaleString("en-IN")}`;

  // today indicator index
  const todayIdx = displayed.findIndex((p) => p.isToday);
  const todayX = todayIdx >= 0 ? toX(todayIdx) : null;
  const todayY = todayIdx >= 0 ? toY(displayed[todayIdx].price) : null;

  // Freeze line Y
  const freezeY = frozenPrice != null ? toY(Math.max(minPrice, Math.min(maxPrice, frozenPrice))) : null;

  // x-axis labels — show every Nth
  const labelEvery = Math.max(1, Math.floor(displayed.length / 6));
  const xLabels = displayed
    .map((p, i) => ({ ...p, i }))
    .filter((_, i) => i % labelEvery === 0 || i === displayed.length - 1);

  return (
    <div style={{ background: "#FFFDF9", borderRadius: 20, border: "1px solid #E6DDD0", padding: "18px 18px 14px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#1E293B" }}>{formatPrice(todayPrice)}</span>
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
              background: trend === "up" ? "#FEE2E2" : trend === "down" ? "#DCFCE7" : "#F3EBDD",
              color: trend === "up" ? "#DC2626" : trend === "down" ? "#166534" : "#57534E",
            }}>
              {trend === "up" ? <TrendingUp size={13} /> : trend === "down" ? <TrendingDown size={13} /> : <Minus size={13} />}
              {trend === "up" ? "Rising" : trend === "down" ? "Falling" : "Stable"}
            </span>
            {frozenPrice != null && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
                <Snowflake size={12} />
                Frozen @ {formatPrice(frozenPrice)}
              </span>
            )}
          </div>
        </div>
        {/* Range selector */}
        <div style={{ display: "flex", gap: 4, background: "#F3EBDD", borderRadius: 10, padding: 3, border: "1px solid #E6DDD0" }}>
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              style={{
                padding: "4px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: selectedRange === r ? accentColor : "transparent",
                color: selectedRange === r ? "#fff" : "#57534E",
                transition: "all 0.2s",
              }}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      {/* Min / Max badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "#DCFCE7", color: "#166534", fontWeight: 700 }}>
          Lowest: {formatPrice(minPrice)}
        </span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>
          Highest: {formatPrice(maxPrice)}
        </span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "#F3EBDD", color: "#57534E", fontWeight: 600, border: "1px solid #E6DDD0" }}>
          Avg: {formatPrice(Math.round(prices.reduce((a, b) => a + b, 0) / prices.length))}
        </span>
      </div>

      {/* SVG Chart */}
      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", minWidth: 300, display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLevels.map((g, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                y1={g.y}
                x2={W - PAD_R}
                y2={g.y}
                stroke="#E6DDD0"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={PAD_L - 8}
                y={g.y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#786C60"
                fontWeight={600}
                fontFamily="inherit"
              >
                {formatPrice(Math.round(g.price))}
              </text>
            </g>
          ))}

          {/* Frozen price dashed line */}
          {freezeY != null && (
            <g>
              <line
                x1={PAD_L}
                y1={freezeY}
                x2={W - PAD_R}
                y2={freezeY}
                stroke="#2563EB"
                strokeWidth={1.5}
                strokeDasharray="6 3"
              />
              <text
                x={W - PAD_R - 4}
                y={freezeY - 4}
                textAnchor="end"
                fontSize={9}
                fill="#2563EB"
                fontWeight={700}
                fontFamily="inherit"
              >
                ❄ Frozen Price
              </text>
            </g>
          )}

          {/* Area fill */}
          <path d={areaPath} fill="url(#priceAreaGrad)" />

          {/* Price line */}
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X axis labels */}
          {xLabels.map((lbl, idx) => (
            <text
              key={idx}
              x={toX(lbl.i)}
              y={H - 10}
              textAnchor="middle"
              fontSize={10}
              fill="#786C60"
              fontWeight={500}
              fontFamily="inherit"
            >
              {lbl.displayDate}
            </text>
          ))}

          {/* Today dot indicator */}
          {todayX != null && todayY != null && (
            <g>
              <circle cx={todayX} cy={todayY} r={6} fill={accentColor} stroke="#FFFDF9" strokeWidth={2} />
              <circle cx={todayX} cy={todayY} r={10} fill="none" stroke={accentColor} strokeWidth={1.5} opacity={0.4} />
            </g>
          )}

          {/* Hover crosshair & point */}
          {tooltip && (
            <g>
              <line
                x1={tooltip.x}
                y1={PAD_T}
                x2={tooltip.x}
                y2={PAD_T + chartH}
                stroke="#C2410C"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#C2410C" stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: `${(tooltip.x / W) * 100}%`,
              top: `${(tooltip.y / H) * 100}%`,
              transform: "translate(-50%, -125%)",
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "4px 8px",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{tooltip.point.displayDate}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
              {formatPrice(tooltip.point.price)}
              {tooltip.point.isToday && <span style={{ color: "#F97316", marginLeft: 4 }}>• Today</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, textAlign: "right", fontSize: 10, color: "#786C60" }}>
        Prices updated hourly · Historical trends based on search and seat inventory
      </div>
    </div>
  );
}
