"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Sparkles, ThumbsUp, ThumbsDown, X, ChevronLeft, ChevronRight,
  Info, Plane, Building2, MapPin, RefreshCw, User, Tag,
} from "lucide-react";
import {
  generateRecommendations,
  saveFeedback,
  dismissRecommendation,
  getProfileSummary,
  recordInteraction,
  getFeedback,
  REC_UPDATED_EVENT,
  RecommendationItem,
  RecCategory,
} from "@/lib/recommendationEngine";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  title?: string;
  maxItems?: number;
  filterCategory?: RecCategory;
  className?: string;
}

// ─── Category filter tabs ─────────────────────────────────────────────────────
const TABS: { key: RecCategory | "all"; label: string; icon: React.ReactNode }[] = [
  { key: "all",         label: "All Picks",    icon: <Sparkles className="w-3.5 h-3.5" /> },
  { key: "flight",      label: "Flights",      icon: <Plane className="w-3.5 h-3.5" /> },
  { key: "hotel",       label: "Hotels",       icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "destination", label: "Destinations", icon: <MapPin className="w-3.5 h-3.5" /> },
];

// ─── WhyTooltip ───────────────────────────────────────────────────────────────
function WhyTooltip({ item }: { item: RecommendationItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        id={`why-btn-${item.id}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((p) => !p); }}
        className="flex items-center gap-1 text-[10px] font-semibold text-[#C2410C] hover:text-[#9A3412] transition-colors px-2 py-1 rounded-lg bg-[#FFF1EB] hover:bg-[#FFE4D6] border border-[#FDBA74]/50"
        title="Why this recommendation?"
      >
        <Info className="w-3 h-3" />
        Why this?
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="bg-[#FFFDF9] border border-[#E6DDD0] rounded-2xl shadow-xl shadow-stone-800/10 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-[#E6DDD0]">
              <Sparkles className="w-4 h-4 text-[#C2410C] shrink-0" />
              <span className="text-xs font-bold text-[#1E293B]">Why we recommend this</span>
            </div>

            {/* Reasons */}
            <div className="space-y-2.5">
              {item.reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none mt-0.5">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#1E293B] leading-snug">{r.label}</p>
                    <p className="text-[10px] text-[#786C60] leading-snug mt-0.5">{r.detail}</p>
                  </div>
                  {/* Strength bar */}
                  <div className="ml-auto shrink-0 w-10 flex flex-col items-end justify-center gap-0.5">
                    <div className="w-full h-1.5 bg-[#E6DDD0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C2410C] rounded-full transition-all"
                        style={{ width: `${Math.round(r.weight * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-[#786C60]">{Math.round(r.weight * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Algorithm note */}
            <div className="pt-2 border-t border-[#E6DDD0] text-[9px] text-[#786C60] leading-relaxed">
              Scored using interest profiling & collaborative filtering across similar traveller journeys.
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute right-4 -bottom-1.5 w-3 h-3 bg-[#FFFDF9] border-r border-b border-[#E6DDD0] rotate-45" />
        </div>
      )}
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecCard({ item, onFeedback, onDismiss }: {
  item: RecommendationItem;
  onFeedback: (id: string, value: "helpful" | "irrelevant") => void;
  onDismiss: (id: string) => void;
}) {
  const [localFeedback, setLocalFeedback] = useState<"helpful" | "irrelevant" | null>(
    () => (getFeedback()[item.id] as "helpful" | "irrelevant" | undefined) ?? null
  );
  const [dismissing, setDismissing] = useState(false);

  const handleFeedback = (v: "helpful" | "irrelevant") => {
    setLocalFeedback(v);
    onFeedback(item.id, v);
    // Record as interaction for profile enrichment
    recordInteraction({
      type: "view",
      category: item.category,
      id: item.id,
      label: item.title,
      tags: item.tags,
      price: item.price ? parseFloat(item.price.replace(/[^\d]/g, "")) || undefined : undefined,
    });
  };

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(() => onDismiss(item.id), 300);
  };

  const linkHref = item.flightId
    ? `/book-flight/${item.flightId}`
    : item.hotelId
    ? `/book-hotel/${item.hotelId}`
    : "#";

  const catIcon = item.category === "flight"
    ? <Plane className="w-3 h-3" />
    : item.category === "hotel"
    ? <Building2 className="w-3 h-3" />
    : <MapPin className="w-3 h-3" />;

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[#E6DDD0] hover:border-[#D48B68] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
        dismissing ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ transition: "opacity 0.3s, transform 0.3s" }}
    >
      {/* Image */}
      <Link
        href={linkHref}
        className="block relative overflow-hidden aspect-[16/10]"
        onClick={() => recordInteraction({ type: "view", category: item.category, id: item.id, label: item.title, tags: item.tags })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Badge */}
        {item.badge && (
          <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm bg-[#1E293B]/85 text-amber-50 backdrop-blur-xs">
            {item.badge}
          </span>
        )}

        {/* Category chip */}
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white">
          {catIcon}
          <span className="capitalize">{item.category}</span>
        </span>

        {/* Dismiss button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDismiss(); }}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 mt-6 bg-black/70 backdrop-blur-sm text-white/80 hover:text-white rounded-full p-1 transition-all"
          title="Not interested"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Price display overlay on image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <div>
            {item.originalPrice && (
              <span className="block text-[10px] text-white/70 line-through leading-none">{item.originalPrice}</span>
            )}
            <span className="text-base font-black text-amber-50 leading-tight drop-shadow-sm">{item.price}</span>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-2 p-3.5">
        <div>
          <h3 className="text-xs font-bold text-[#1E293B] group-hover:text-[#C2410C] transition-colors leading-tight truncate">
            {item.title}
          </h3>
          <p className="text-[11px] text-[#786C60] mt-0.5 leading-snug line-clamp-1">{item.subtitle}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 text-[9px] font-medium text-[#786C60] bg-[#F3EBDD] border border-[#E6DDD0] px-1.5 py-0.5 rounded-full capitalize">
              <Tag className="w-2 h-2 text-[#C2410C]" />
              {tag}
            </span>
          ))}
        </div>

        {/* Footer: Why + Feedback */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#E6DDD0]">
          <WhyTooltip item={item} />

          <div className="flex items-center gap-1">
            <button
              id={`helpful-${item.id}`}
              onClick={() => handleFeedback("helpful")}
              className={`p-1.5 rounded-lg border transition-all ${
                localFeedback === "helpful"
                  ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                  : "border-[#E6DDD0] text-[#786C60] hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
              title="Helpful recommendation"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              id={`irrelevant-${item.id}`}
              onClick={() => handleFeedback("irrelevant")}
              className={`p-1.5 rounded-lg border transition-all ${
                localFeedback === "irrelevant"
                  ? "bg-rose-100 border-rose-400 text-rose-800"
                  : "border-[#E6DDD0] text-[#786C60] hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50"
              }`}
              title="Not relevant"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PersonalizedRecommendations({
  title = "Recommended for You",
  maxItems = 12,
  filterCategory,
  className = "",
}: Props) {
  const [activeTab, setActiveTab] = useState<RecCategory | "all">(filterCategory ?? "all");
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [profile, setProfile] = useState<{ topTags: string[]; topPersona: string; totalInteractions: number } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Load recommendations
  const load = useCallback(() => {
    const cat = activeTab === "all" ? undefined : activeTab;
    setItems(generateRecommendations(maxItems, cat));
    setProfile(getProfileSummary());
  }, [activeTab, maxItems, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  // React to feedback/history changes
  useEffect(() => {
    const handler = () => load();
    window.addEventListener(REC_UPDATED_EVENT, handler);
    return () => window.removeEventListener(REC_UPDATED_EVENT, handler);
  }, [load]);

  // Scroll state
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [checkScroll, items]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
      setIsRefreshing(false);
    }, 600);
  };

  const handleFeedback = (id: string, value: "helpful" | "irrelevant") => {
    saveFeedback(id, value);
    // Reload after a tiny delay so UI shows the animation first
    setTimeout(() => load(), 400);
  };

  const handleDismiss = (id: string) => {
    dismissRecommendation(id);
    setTimeout(() => load(), 350);
  };

  if (items.length === 0 && !isRefreshing) return null;

  return (
    <section className={`relative ${className}`} id="personalized-recommendations" aria-label="Personalized Recommendations">

      {/* Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#C2410C]" />
            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">{title}</h2>
          </div>

          {/* Profile persona pill */}
          {profile && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#786C60] font-medium mt-1">
              <span className="inline-flex items-center gap-1 bg-[#F3EBDD] border border-[#E6DDD0] text-[#57534E] rounded-full px-2.5 py-0.5 text-[11px]">
                <User className="w-3 h-3 text-[#C2410C]" />
                <span className="font-semibold text-[#1E293B]">{profile.topPersona}</span>
              </span>
              {profile.topTags.length > 0 && (
                <>
                  <span>•</span>
                  <span>Interests: {profile.topTags.map((t) => `#${t}`).join(", ")}</span>
                </>
              )}
              <span>•</span>
              <span>{profile.totalInteractions} signals</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            id="rec-refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-[#57534E] hover:text-[#1E293B] transition-colors px-3 py-1.5 rounded-xl bg-[#F3EBDD]/60 hover:bg-[#F3EBDD] border border-[#E6DDD0] font-medium disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C2410C] ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Picks</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`rec-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.key
                ? "bg-[#C2410C] border-[#C2410C] text-white shadow-sm"
                : "bg-[#F3EBDD]/50 border-[#E6DDD0] text-[#57534E] hover:text-[#1E293B] hover:bg-[#F3EBDD]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] flex items-center justify-center shadow-md hover:border-[#D48B68] hover:bg-white transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#E6DDD0] text-[#1E293B] flex items-center justify-center shadow-md hover:border-[#D48B68] hover:bg-white transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {isRefreshing
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[270px] snap-start rounded-2xl bg-white border border-[#E6DDD0] animate-pulse overflow-hidden"
                >
                  <div className="w-full aspect-[16/10] bg-[#F3EBDD]" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-[#F3EBDD] rounded w-3/4" />
                    <div className="h-3 bg-[#F3EBDD] rounded w-1/2" />
                    <div className="h-3 bg-[#F3EBDD] rounded w-full mt-3" />
                  </div>
                </div>
              ))
            : items.map((item) => (
                <div key={item.id} className="shrink-0 w-[270px] snap-start">
                  <RecCard item={item} onFeedback={handleFeedback} onDismiss={handleDismiss} />
                </div>
              ))}
        </div>
      </div>

      {/* Feedback education footer */}
      <p className="mt-3 text-[11px] text-[#786C60] text-center font-medium">
        👍 / 👎 feedback refines your personal recommendations · Adapts as you browse & book
      </p>
    </section>
  );
}
