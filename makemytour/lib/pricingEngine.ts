export interface PricingFactor {
  label: string;
  emoji: string;
  multiplier: number;
  description: string;
  color: "red" | "orange" | "green" | "blue";
}

export interface DynamicPriceResult {
  originalPrice: number;
  dynamicPrice: number;
  totalMultiplier: number;
  surgePercent: number;
  factors: PricingFactor[];
  demandLevel: "Very Low" | "Low" | "Moderate" | "High" | "Very High" | "Peak";
  demandColor: string;
  lastUpdated: Date;
}

export interface PriceHistoryPoint {
  date: string;
  displayDate: string;
  price: number;
  isToday: boolean;
  isFrozen?: boolean;
}

export interface PriceFreeze {
  id: string;
  type: "flight" | "hotel";
  bookingId: string;
  frozenPrice: number;
  originalPrice: number;
  createdAt: number;
  expiresAt: number;
  durationHours: number;
}

const PEAK_DATES: Record<string, { label: string; multiplier: number }> = {
  "12-25": { label: "Christmas", multiplier: 1.38 },
  "12-26": { label: "Boxing Day", multiplier: 1.30 },
  "12-31": { label: "New Year's Eve", multiplier: 1.45 },
  "01-01": { label: "New Year's Day", multiplier: 1.40 },
  "01-14": { label: "Makar Sankranti", multiplier: 1.18 },
  "01-26": { label: "Republic Day", multiplier: 1.22 },
  "02-14": { label: "Valentine's Day", multiplier: 1.25 },
  "03-25": { label: "Holi Festival", multiplier: 1.20 },
  "04-14": { label: "Baisakhi", multiplier: 1.15 },
  "08-15": { label: "Independence Day", multiplier: 1.24 },
  "10-02": { label: "Gandhi Jayanti", multiplier: 1.12 },
  "10-24": { label: "Diwali Season", multiplier: 1.42 },
  "10-25": { label: "Diwali", multiplier: 1.48 },
  "10-26": { label: "Diwali", multiplier: 1.42 },
  "11-01": { label: "Diwali Week", multiplier: 1.28 },
};

const SEASONAL_MULTIPLIERS = [0.88, 0.92, 0.95, 1.02, 0.96, 1.08, 1.18, 1.15, 1.02, 1.05, 1.12, 1.30];

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function dateSeed(date: Date, id: string): number {
  const d = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const idHash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return d + idHash;
}

export function calculateDynamicPrice(
  basePrice: number,
  bookingId: string,
  date: Date = new Date()
): DynamicPriceResult {
  const factors: PricingFactor[] = [];
  let multiplier = 1.0;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const seasonMult = SEASONAL_MULTIPLIERS[date.getMonth()];
  factors.push({
    label: seasonMult > 1.0 ? `${monthNames[date.getMonth()]} Peak Season` : `${monthNames[date.getMonth()]} Off-Season`,
    emoji: seasonMult > 1.0 ? "📅" : "🎉",
    multiplier: seasonMult,
    description: seasonMult > 1.0 ? `${monthNames[date.getMonth()]} is a high-demand travel period` : "Enjoy discounted rates during low-demand season",
    color: seasonMult > 1.15 ? "red" : seasonMult > 1.0 ? "orange" : "green",
  });
  multiplier *= seasonMult;

  const mmdd = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const holiday = PEAK_DATES[mmdd];
  if (holiday) {
    factors.push({
      label: holiday.label,
      emoji: "🎊",
      multiplier: holiday.multiplier,
      description: `Holiday surge: prices rise ${Math.round((holiday.multiplier - 1) * 100)}% around ${holiday.label}`,
      color: "red",
    });
    multiplier *= holiday.multiplier;
  }

  const dow = date.getDay();
  if (dow === 5 || dow === 6) {
    factors.push({ label: "Weekend Demand", emoji: "📈", multiplier: 1.08, description: "Weekend bookings see 8% higher demand", color: "orange" });
    multiplier *= 1.08;
  } else if (dow === 2 || dow === 3) {
    factors.push({ label: "Mid-Week Discount", emoji: "💸", multiplier: 0.94, description: "Tue/Wed are the most affordable days to travel", color: "green" });
    multiplier *= 0.94;
  }

  const hour = date.getHours();
  if (hour >= 9 && hour <= 12) {
    factors.push({ label: "Morning Rush", emoji: "⏰", multiplier: 1.04, description: "Morning hours (9–12) see peak booking traffic", color: "orange" });
    multiplier *= 1.04;
  } else if (hour >= 22 || hour < 5) {
    factors.push({ label: "Night-Owl Discount", emoji: "🌙", multiplier: 0.97, description: "Late-night sessions often yield slightly lower prices", color: "green" });
    multiplier *= 0.97;
  }

  const seed = dateSeed(date, bookingId);
  const noise = (seededRandom(seed) - 0.5) * 0.12;
  const noiseMult = 1 + noise;
  if (noise > 0.02) {
    factors.push({ label: "High Demand Surge", emoji: "🔥", multiplier: noiseMult, description: `Real-time demand is elevated by ${Math.round(noise * 100)}%`, color: "red" });
  } else if (noise < -0.02) {
    factors.push({ label: "Demand Dip Discount", emoji: "🏷️", multiplier: noiseMult, description: `Real-time demand is down, saving you ${Math.round(-noise * 100)}%`, color: "green" });
  }
  multiplier *= noiseMult;

  multiplier = Math.round(multiplier * 100) / 100;
  const dynamicPrice = Math.round(basePrice * multiplier);
  const surgePercent = Math.round((multiplier - 1) * 100);

  let demandLevel: DynamicPriceResult["demandLevel"];
  let demandColor: string;
  if (multiplier >= 1.40) { demandLevel = "Peak"; demandColor = "#ef4444"; }
  else if (multiplier >= 1.25) { demandLevel = "Very High"; demandColor = "#f97316"; }
  else if (multiplier >= 1.10) { demandLevel = "High"; demandColor = "#eab308"; }
  else if (multiplier >= 0.98) { demandLevel = "Moderate"; demandColor = "#22c55e"; }
  else if (multiplier >= 0.90) { demandLevel = "Low"; demandColor = "#3b82f6"; }
  else { demandLevel = "Very Low"; demandColor = "#6366f1"; }

  return { originalPrice: basePrice, dynamicPrice, totalMultiplier: multiplier, surgePercent, factors, demandLevel, demandColor, lastUpdated: date };
}

export function generatePriceHistory(basePrice: number, bookingId: string, days = 30): PriceHistoryPoint[] {
  const history: PriceHistoryPoint[] = [];
  const today = new Date();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const result = calculateDynamicPrice(basePrice, bookingId, d);
    const isToday = i === 0;
    const displayDate = isToday ? "Today" : i === 1 ? "Yesterday" : `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
    history.push({ date: d.toISOString().split("T")[0], displayDate, price: result.dynamicPrice, isToday });
  }
  return history;
}

const FREEZE_KEY = "mmt_price_freezes";

export function getAllFreezes(): PriceFreeze[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FREEZE_KEY) || "[]"); } catch { return []; }
}

export function getActiveFreeze(bookingId: string, type: "flight" | "hotel"): PriceFreeze | null {
  return getAllFreezes().find(f => f.bookingId === bookingId && f.type === type && f.expiresAt > Date.now()) || null;
}

export function createPriceFreeze(bookingId: string, type: "flight" | "hotel", frozenPrice: number, originalPrice: number, durationHours: number): PriceFreeze {
  const now = Date.now();
  const freeze: PriceFreeze = { id: `freeze_${now}_${Math.random().toString(36).slice(2,7)}`, type, bookingId, frozenPrice, originalPrice, createdAt: now, expiresAt: now + durationHours * 3600000, durationHours };
  const all = getAllFreezes().filter(f => !(f.bookingId === bookingId && f.type === type));
  all.push(freeze);
  localStorage.setItem(FREEZE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("mmt_price_freeze_updated", { detail: freeze }));
  return freeze;
}

export function cancelPriceFreeze(bookingId: string, type: "flight" | "hotel"): void {
  const all = getAllFreezes().filter(f => !(f.bookingId === bookingId && f.type === type));
  localStorage.setItem(FREEZE_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent("mmt_price_freeze_updated", { detail: null }));
}

export function getRemainingFreezeTime(freeze: PriceFreeze) {
  const remaining = Math.max(0, freeze.expiresAt - Date.now());
  const totalDuration = freeze.expiresAt - freeze.createdAt;
  const totalSeconds = Math.floor(remaining / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    percent: Math.round((remaining / totalDuration) * 100),
  };
}

export const FREEZE_PLANS = [
  { hours: 6,  label: "6 Hours",  fee: 99,  badge: null },
  { hours: 12, label: "12 Hours", fee: 149, badge: "Popular" },
  { hours: 24, label: "24 Hours", fee: 249, badge: "Best Value" },
];
