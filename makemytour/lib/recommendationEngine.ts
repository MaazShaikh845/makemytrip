// Client-side heuristics and affinity scoring for travel items

const KEY_HISTORY = "mmt_rec_history";
const KEY_FEEDBACK = "mmt_rec_feedback";
const KEY_DISMISSED = "mmt_rec_dismissed";
export const REC_UPDATED_EVENT = "mmt_recommendations_updated";

export type RecCategory = "flight" | "hotel" | "destination";
export type FeedbackValue = "helpful" | "irrelevant";

export interface InteractionEvent {
  type: "view" | "search" | "booked" | "price_checked";
  category: RecCategory;
  id: string;
  label: string;
  tags: string[];
  price?: number;
  timestamp: number;
}

export interface UserInterestProfile {
  tagScores: Record<string, number>;
  cityScores: Record<string, number>;
  categoryScores: Record<RecCategory, number>;
  totalInteractions: number;
  lastActive: number;
}

export interface ReasonToken {
  emoji: string;
  label: string;
  detail: string;
  weight: number;
}

export interface RecommendationItem {
  id: string;
  category: RecCategory;
  title: string;
  subtitle: string;
  destination: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  tags: string[];
  score: number;
  reasons: ReasonToken[];
  badge?: string;
  badgeColor?: string;
  flightId?: string;
  hotelId?: string;
}

export interface RecFeedback {
  [recId: string]: FeedbackValue;
}

export const REC_CATALOGUE: Omit<RecommendationItem, "score" | "reasons" | "badge" | "badgeColor">[] = [
  // FLIGHTS
  { id: "r-flt-bali", category: "flight", title: "Mumbai → Bali", subtitle: "Non-stop · 6h 20m · Economy", destination: "Bali", price: "₹8,290", originalPrice: "₹11,400", imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600", tags: ["beach","international","island","tropical","honeymoon"], flightId: "1" },
  { id: "r-flt-maldives", category: "flight", title: "Delhi → Maldives", subtitle: "1 Stop · 5h 45m · Economy", destination: "Maldives", price: "₹12,490", originalPrice: "₹16,200", imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600", tags: ["beach","island","luxury","honeymoon","international"], flightId: "2" },
  { id: "r-flt-goa", category: "flight", title: "Delhi → Goa", subtitle: "Non-stop · 2h 30m · Economy", destination: "Goa", price: "₹4,120", originalPrice: "₹5,800", imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600", tags: ["beach","domestic","party","weekend"], flightId: "3" },
  { id: "r-flt-dubai", category: "flight", title: "Mumbai → Dubai", subtitle: "Non-stop · 3h 10m · Business", destination: "Dubai", price: "₹9,400", originalPrice: "₹14,000", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600", tags: ["international","luxury","shopping","business","city"], flightId: "4" },
  { id: "r-flt-kashmir", category: "flight", title: "Delhi → Srinagar", subtitle: "Non-stop · 1h 20m · Economy", destination: "Kashmir", price: "₹5,400", originalPrice: "₹7,200", imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600", tags: ["mountain","snow","nature","domestic","romantic"], flightId: "5" },
  { id: "r-flt-tokyo", category: "flight", title: "Mumbai → Tokyo", subtitle: "1 Stop · 9h 50m · Economy", destination: "Tokyo", price: "₹24,800", originalPrice: "₹31,500", imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600", tags: ["international","culture","city","food"], flightId: "6" },
  { id: "r-flt-paris", category: "flight", title: "Delhi → Paris", subtitle: "1 Stop · 10h 30m · Business", destination: "Paris", price: "₹38,900", originalPrice: "₹52,000", imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600", tags: ["international","luxury","romance","culture","city"], flightId: "7" },
  { id: "r-flt-jaipur", category: "flight", title: "Mumbai → Jaipur", subtitle: "Non-stop · 1h 50m · Economy", destination: "Jaipur", price: "₹2,890", originalPrice: "₹4,100", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600", tags: ["heritage","domestic","culture","history","budget"], flightId: "8" },
  // HOTELS
  { id: "r-htl-beachgoa", category: "hotel", title: "The Grand Beach Resort", subtitle: "5★ · Calangute, Goa · Pool & Spa", destination: "Goa", price: "₹6,800/night", originalPrice: "₹9,200/night", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600", tags: ["beach","luxury","pool","spa","domestic"], hotelId: "1" },
  { id: "r-htl-kashmir", category: "hotel", title: "Alpine Retreat Srinagar", subtitle: "4★ · Dal Lake View · Houseboat Style", destination: "Kashmir", price: "₹4,200/night", originalPrice: "₹5,900/night", imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600", tags: ["mountain","nature","romantic","domestic","scenic"], hotelId: "2" },
  { id: "r-htl-dubai", category: "hotel", title: "Burj Al Arab Jumeirah", subtitle: "7★ · Downtown Dubai · All Inclusive", destination: "Dubai", price: "₹38,000/night", originalPrice: "₹52,000/night", imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600", tags: ["luxury","international","business","city","shopping"], hotelId: "3" },
  { id: "r-htl-jaipur", category: "hotel", title: "Rambagh Palace Hotel", subtitle: "5★ · Heritage Property · Jaipur Old City", destination: "Jaipur", price: "₹12,400/night", originalPrice: "₹17,800/night", imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600", tags: ["heritage","luxury","culture","domestic","history"], hotelId: "4" },
  { id: "r-htl-mumbai", category: "hotel", title: "Trident Nariman Point", subtitle: "5★ · Sea View · Business District", destination: "Mumbai", price: "₹8,600/night", originalPrice: "₹11,000/night", imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600", tags: ["city","business","domestic"], hotelId: "5" },
  { id: "r-htl-maldives", category: "hotel", title: "W Maldives Water Villas", subtitle: "5★ · Overwater Bungalow · Reef View", destination: "Maldives", price: "₹42,000/night", originalPrice: "₹58,000/night", imageUrl: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600", tags: ["beach","island","luxury","honeymoon","international"], hotelId: "6" },
  // DESTINATIONS
  { id: "r-dst-bali", category: "destination", title: "Bali, Indonesia", subtitle: "Temples, Rice Terraces & Surf Culture", destination: "Bali", price: "From ₹18,500", imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600", tags: ["beach","island","tropical","culture","honeymoon","international"] },
  { id: "r-dst-kerala", category: "destination", title: "Kerala Backwaters", subtitle: "Houseboat Cruises, Spice Gardens & Tea Hills", destination: "Kerala", price: "From ₹6,800", imageUrl: "https://images.unsplash.com/photo-1602215529822-47c96a406695?w=600", tags: ["nature","beach","domestic","culture","scenic","romantic"] },
  { id: "r-dst-rajasthan", category: "destination", title: "Royal Rajasthan", subtitle: "Palaces, Sand Dunes & Camel Safaris", destination: "Rajasthan", price: "From ₹7,200", imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600", tags: ["heritage","culture","history","domestic","desert"] },
  { id: "r-dst-swiss", category: "destination", title: "Swiss Alps Adventure", subtitle: "Skiing, Scenic Railways & Chocolate Trails", destination: "Switzerland", price: "From ₹84,000", imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600", tags: ["mountain","snow","international","luxury","adventure"] },
  { id: "r-dst-singapore", category: "destination", title: "Singapore City Break", subtitle: "Gardens by the Bay & Hawker Food", destination: "Singapore", price: "From ₹22,400", imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600", tags: ["city","international","food","shopping","family"] },
  { id: "r-dst-himachal", category: "destination", title: "Himachal Pradesh", subtitle: "Manali, Spiti Valley & Snow Peaks", destination: "Himachal Pradesh", price: "From ₹8,900", imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600", tags: ["mountain","snow","adventure","domestic","nature"] },
  { id: "r-dst-andaman", category: "destination", title: "Andaman Islands", subtitle: "Radhanagar Beach, Scuba Diving & Coral Reefs", destination: "Andaman", price: "From ₹14,200", imageUrl: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600", tags: ["beach","island","domestic","adventure","diving"] },
  { id: "r-dst-thailand", category: "destination", title: "Thailand — Land of Smiles", subtitle: "Bangkok, Phuket & Chiang Mai Temples", destination: "Thailand", price: "From ₹16,800", imageUrl: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600", tags: ["beach","island","international","budget","culture","food"] },
  { id: "r-dst-nyc", category: "destination", title: "New York City", subtitle: "Times Square, Central Park & Broadway Shows", destination: "New York", price: "From ₹68,000", imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600", tags: ["city","international","culture","shopping","luxury"] },
];

const DEFAULT_INTERACTIONS: InteractionEvent[] = [
  { type: "search", category: "flight", id: "demo-1", label: "Mumbai → Goa", tags: ["beach","domestic","weekend"], price: 4200, timestamp: Date.now() - 8 * 86400000 },
  { type: "view", category: "hotel", id: "demo-2", label: "Grand Beach Resort", tags: ["beach","luxury","pool"], price: 6800, timestamp: Date.now() - 5 * 86400000 },
  { type: "view", category: "destination", id: "demo-3", label: "Bali, Indonesia", tags: ["beach","island","tropical","international"], timestamp: Date.now() - 3 * 86400000 },
];

interface PersonaProfile {
  id: string;
  label: string;
  tagAffinity: Record<string, number>;
}

const PERSONAS: PersonaProfile[] = [
  { id: "beach-lover", label: "Beach & Island Enthusiast", tagAffinity: { beach: 3, island: 3, tropical: 2, honeymoon: 2, diving: 2, international: 1 } },
  { id: "mountain-trekker", label: "Mountain & Adventure Seeker", tagAffinity: { mountain: 3, snow: 2, adventure: 3, nature: 2, domestic: 1 } },
  { id: "culture-buff", label: "Heritage & Culture Traveller", tagAffinity: { heritage: 3, culture: 3, history: 2, domestic: 2, city: 1 } },
  { id: "luxury-traveller", label: "Luxury & Business Traveller", tagAffinity: { luxury: 3, business: 2, city: 2, international: 2, shopping: 1 } },
  { id: "budget-backpacker", label: "Budget Backpacker", tagAffinity: { budget: 3, domestic: 2, food: 2, culture: 1, nature: 1 } },
  { id: "family-traveller", label: "Family Holiday Planner", tagAffinity: { family: 3, domestic: 2, beach: 1, culture: 1, city: 1 } },
  { id: "romantic-escaper", label: "Romantic Getaway Seeker", tagAffinity: { romantic: 3, honeymoon: 2, beach: 2, island: 2, scenic: 2, luxury: 1 } },
];

export function getHistory(): InteractionEvent[] {
  if (typeof window === "undefined") return DEFAULT_INTERACTIONS;
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(DEFAULT_INTERACTIONS));
      return DEFAULT_INTERACTIONS;
    }
    return JSON.parse(raw) as InteractionEvent[];
  } catch {
    return DEFAULT_INTERACTIONS;
  }
}

export function recordInteraction(event: Omit<InteractionEvent, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const newEvent: InteractionEvent = { ...event, timestamp: Date.now() };
    const filtered = history.filter((h) => !(h.type === event.type && h.id === event.id));
    filtered.unshift(newEvent);
    localStorage.setItem(KEY_HISTORY, JSON.stringify(filtered.slice(0, 200)));
    window.dispatchEvent(new CustomEvent(REC_UPDATED_EVENT));
  } catch {
    // ignore storage quota issues
  }
}

export function buildProfile(history: InteractionEvent[]): UserInterestProfile {
  const tagScores: Record<string, number> = {};
  const cityScores: Record<string, number> = {};
  const categoryScores: Record<RecCategory, number> = { flight: 0, hotel: 0, destination: 0 };
  const weights: Record<string, number> = { booked: 5, price_checked: 3, search: 2, view: 1 };
  const now = Date.now();

  history.forEach((ev) => {
    const ageDays = (now - ev.timestamp) / 86400000;
    const decay = Math.exp(-ageDays / 30);
    const w = (weights[ev.type] || 1) * decay;
    categoryScores[ev.category] = (categoryScores[ev.category] || 0) + w;
    ev.tags.forEach((tag) => {
      tagScores[tag] = (tagScores[tag] || 0) + w;
    });
    const city = ev.label.split("→").pop()?.trim().split(",")[0].trim() || ev.label;
    cityScores[city] = (cityScores[city] || 0) + w;
  });

  return {
    tagScores,
    cityScores,
    categoryScores,
    totalInteractions: history.length,
    lastActive: history[0]?.timestamp ?? now,
  };
}

function matchPersonas(profile: UserInterestProfile): PersonaProfile[] {
  return PERSONAS
    .map((p) => {
      let sim = 0;
      Object.entries(p.tagAffinity).forEach(([tag, w]) => {
        sim += (profile.tagScores[tag] || 0) * w;
      });
      return { persona: p, sim };
    })
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 2)
    .map((s) => s.persona);
}

export function getFeedback(): RecFeedback {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY_FEEDBACK) || "{}");
  } catch {
    return {};
  }
}

export function saveFeedback(recId: string, value: FeedbackValue): void {
  if (typeof window === "undefined") return;
  try {
    const fb = getFeedback();
    fb[recId] = value;
    localStorage.setItem(KEY_FEEDBACK, JSON.stringify(fb));
    window.dispatchEvent(new CustomEvent(REC_UPDATED_EVENT));
  } catch {
    // local fallback
  }
}

export function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY_DISMISSED) || "[]");
  } catch {
    return [];
  }
}

export function dismissRecommendation(recId: string): void {
  if (typeof window === "undefined") return;
  try {
    const d = getDismissed();
    if (!d.includes(recId)) d.push(recId);
    localStorage.setItem(KEY_DISMISSED, JSON.stringify(d));
    window.dispatchEvent(new CustomEvent(REC_UPDATED_EVENT));
  } catch {
    // local fallback
  }
}

const TAG_EMOJI: Record<string, string> = {
  beach: "🏖", island: "🏝", mountain: "⛰", snow: "❄️", luxury: "💎",
  heritage: "🏛", culture: "🎭", city: "🌆", nature: "🌿", adventure: "🧗",
  honeymoon: "💑", romantic: "🌹", international: "✈️", domestic: "🇮🇳",
  food: "🍜", shopping: "🛍", business: "💼", family: "👨‍👩‍👧", budget: "💰",
  diving: "🤿", tropical: "🌴", pool: "🏊", spa: "🧖", party: "🎉",
  scenic: "🌄", weekend: "📅", desert: "🏜", history: "🏛", romance: "🌹",
};

function generateReasons(
  item: typeof REC_CATALOGUE[number],
  profile: UserInterestProfile,
  topPersonas: PersonaProfile[],
  feedback: RecFeedback
): ReasonToken[] {
  const reasons: ReasonToken[] = [];

  const matchedTags = item.tags.filter((t) => (profile.tagScores[t] || 0) > 0.5);
  if (matchedTags.length > 0) {
    const topTag = matchedTags.sort((a, b) => (profile.tagScores[b] || 0) - (profile.tagScores[a] || 0))[0];
    reasons.push({
      emoji: TAG_EMOJI[topTag] ?? "📌",
      label: `Matches your ${topTag} interest`,
      detail: `You've explored ${topTag} destinations before — this fits your current travel taste.`,
      weight: Math.min(1, (profile.tagScores[topTag] || 0) / 6),
    });
  }

  if ((profile.cityScores[item.destination] || 0) > 0.5) {
    reasons.push({
      emoji: "📍",
      label: `${item.destination} is on your radar`,
      detail: `You recently looked up content connected with ${item.destination}.`,
      weight: Math.min(1, (profile.cityScores[item.destination] || 0) / 5),
    });
  }

  if (topPersonas.length > 0) {
    const personaTagMatch = item.tags.find((t) => (topPersonas[0].tagAffinity[t] || 0) >= 2);
    if (personaTagMatch) {
      reasons.push({
        emoji: "👥",
        label: `Popular with ${topPersonas[0].label}s`,
        detail: "Liked and booked by travellers with overlapping preference clusters.",
        weight: 0.7,
      });
    }
  }

  const catLabels: Record<RecCategory, string> = { flight: "flights", hotel: "hotels", destination: "destinations" };
  if ((profile.categoryScores[item.category] || 0) > 1) {
    reasons.push({
      emoji: "🔁",
      label: `Frequent ${catLabels[item.category]} views`,
      detail: `Your recent queries lean heavily towards ${catLabels[item.category]}.`,
      weight: 0.5,
    });
  }

  if (item.originalPrice) {
    const curr = parseFloat(item.price.replace(/[^\d]/g, ""));
    const orig = parseFloat(item.originalPrice.replace(/[^\d]/g, ""));
    if (orig > 0 && curr > 0 && orig > curr) {
      const pct = Math.round(((orig - curr) / orig) * 100);
      reasons.push({
        emoji: "💰",
        label: `${pct}% below standard rate`,
        detail: "Current pricing is notably below the rolling monthly benchmark.",
        weight: 0.6,
      });
    }
  }

  if (feedback[item.id] === "helpful") {
    reasons.push({
      emoji: "👍",
      label: "Marked helpful by you",
      detail: "You previously marked similar recommendations as relevant.",
      weight: 0.9,
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      emoji: "✨",
      label: "Seasonal highlight",
      detail: "Hand-picked by our itinerary team as a trending route this month.",
      weight: 0.3,
    });
  }

  return reasons.sort((a, b) => b.weight - a.weight).slice(0, 4);
}

const BADGES = [
  { label: "Just for You", color: "bg-[#1E293B] text-amber-50" },
  { label: "Trending", color: "bg-[#C2410C] text-white" },
  { label: "Best Deal", color: "bg-emerald-800 text-white" },
  { label: "Top Rated", color: "bg-amber-700 text-white" },
  { label: "New Route", color: "bg-sky-800 text-white" },
];

function assignBadge(rank: number, item: typeof REC_CATALOGUE[number]) {
  if (rank === 0) return BADGES[0];
  if (item.originalPrice) return BADGES[2];
  if (["beach", "island", "international"].some((t) => item.tags.includes(t))) return BADGES[1];
  if (rank < 3) return BADGES[3];
  return BADGES[4];
}

export function generateRecommendations(count = 12, filterCategory?: RecCategory): RecommendationItem[] {
  const history = getHistory();
  const profile = buildProfile(history);
  const topPersonas = matchPersonas(profile);
  const feedback = getFeedback();
  const dismissed = getDismissed();

  const personaBoosts: Record<string, number> = {};
  topPersonas.forEach((p) => {
    Object.entries(p.tagAffinity).forEach(([tag, w]) => {
      personaBoosts[tag] = (personaBoosts[tag] || 0) + w;
    });
  });

  const catalog = filterCategory ? REC_CATALOGUE.filter((c) => c.category === filterCategory) : REC_CATALOGUE;

  const scored = catalog
    .map((item) => {
      if (dismissed.includes(item.id) || feedback[item.id] === "irrelevant") {
        return { item, score: -Infinity };
      }
      let score = 0;
      item.tags.forEach((tag) => {
        score += (profile.tagScores[tag] || 0) * 2.5;
        score += (personaBoosts[tag] || 0) * 1.2;
      });
      score += (profile.cityScores[item.destination] || 0) * 3;
      score += (profile.categoryScores[item.category] || 0) * 1.5;
      if (feedback[item.id] === "helpful") score += 12;
      score += Math.random() * 0.4;
      return { item, score };
    })
    .filter((s) => s.score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  return scored.map(({ item, score }, rank) => {
    const badge = assignBadge(rank, item);
    return {
      ...item,
      score,
      reasons: generateReasons(item, profile, topPersonas, feedback),
      badge: badge.label,
      badgeColor: badge.color,
    } as RecommendationItem;
  });
}

export function getProfileSummary(): { topTags: string[]; topPersona: string; totalInteractions: number } {
  const history = getHistory();
  const profile = buildProfile(history);
  const topPersona = PERSONAS
    .map((p) => {
      let sim = 0;
      Object.entries(p.tagAffinity).forEach(([tag, w]) => {
        sim += (profile.tagScores[tag] || 0) * w;
      });
      return { label: p.label, sim };
    })
    .sort((a, b) => b.sim - a.sim)[0]?.label ?? "Explorer";

  const topTags = Object.entries(profile.tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  return { topTags, topPersona, totalInteractions: profile.totalInteractions };
}
