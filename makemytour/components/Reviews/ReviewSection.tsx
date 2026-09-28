"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Star,
  ThumbsUp,
  Flag,
  MessageSquare,
  Camera,
  X,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Pencil,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import {
  Review,
  ReviewReply,
  ReviewSummary,
  getReviews,
  createReview,
  updateReview,
  replyToReview,
  toggleHelpfulReview,
  flagReview,
  deleteReview,
  deleteReviewReply,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SignupDialog from "@/components/ui/SignupDialog";

interface ReviewSectionProps {
  targetType: "HOTEL" | "FLIGHT";
  targetId: string;
  targetName?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Terrible",
  2: "Poor",
  3: "Average",
  4: "Very Good",
  5: "Excellent",
};

export default function ReviewSection({
  targetType,
  targetId,
  targetName,
}: ReviewSectionProps) {
  const auth = useSelector((state: RootState) => state.auth);
  const currentUserId = auth?.user?.id;
  const isAdmin = auth?.user?.role?.toUpperCase() === "ADMIN";

  // Data states
  const [data, setData] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Sorting & Filtering
  const [sortOption, setSortOption] = useState<"helpful" | "newest" | "highest" | "lowest">("helpful");
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);

  // Modals
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [flagModalTarget, setFlagModalTarget] = useState<Review | null>(null);
  const [flagReason, setFlagReason] = useState("Spam or fraudulent content");

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Inline Reply states
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Collapsed replies state
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Fetch reviews on mount or targetId change
  const loadReviews = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      setFetchError(null);
      const res = await getReviews(targetType, targetId);
      setData(res);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId]);

  // Handle Photo Upload via file input (convert to compressed Base64 data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedPhotos.length + files.length > 5) {
      setPhotoError("Maximum 5 photos allowed per review.");
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Only image files (JPG, PNG, WebP) are supported.");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        setPhotoError("Images must be smaller than 4MB each.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) {
          setUploadedPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartEdit = (rev: Review) => {
    setEditingReview(rev);
    setRating(rev.rating);
    setTitle(rev.title || "");
    setComment(rev.comment);
    setUploadedPhotos(rev.photos || []);
    setPhotoError(null);
    setWriteModalOpen(true);
  };

  const handleOpenNewReview = () => {
    if (!currentUserId) {
      setSignupModalOpen(true);
      return;
    }
    setEditingReview(null);
    setRating(5);
    setTitle("");
    setComment("");
    setUploadedPhotos([]);
    setPhotoError(null);
    setWriteModalOpen(true);
  };

  // Submit Review (Create or Update)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setSignupModalOpen(true);
      return;
    }
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      if (editingReview) {
        await updateReview(currentUserId, editingReview.id, {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          photos: uploadedPhotos,
        });
      } else {
        await createReview(currentUserId, {
          targetType,
          targetId,
          targetName,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          photos: uploadedPhotos,
        });
      }

      // Reset form & close
      setEditingReview(null);
      setRating(5);
      setTitle("");
      setComment("");
      setUploadedPhotos([]);
      setWriteModalOpen(false);
      await loadReviews();
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Helpful
  const handleToggleHelpful = async (review: Review) => {
    if (!currentUserId) {
      setSignupModalOpen(true);
      return;
    }
    try {
      const updated = await toggleHelpfulReview(currentUserId, review.id);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === updated.id ? updated : r)),
        };
      });
    } catch (err) {
      console.error("Failed to toggle helpful", err);
    }
  };

  // Flag Review
  const handleFlagReview = async () => {
    if (!currentUserId) {
      setSignupModalOpen(true);
      return;
    }
    if (!flagModalTarget) return;

    try {
      const updated = await flagReview(currentUserId, flagModalTarget.id, flagReason);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === updated.id ? updated : r)),
        };
      });
      setFlagModalTarget(null);
    } catch (err) {
      console.error("Failed to flag review", err);
    }
  };

  // Submit Reply
  const handleSubmitReply = async (reviewId: string) => {
    if (!currentUserId) {
      setSignupModalOpen(true);
      return;
    }
    if (!replyText.trim()) return;

    setReplySubmitting(true);
    try {
      const updated = await replyToReview(currentUserId, reviewId, replyText.trim());
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === updated.id ? updated : r)),
        };
      });
      setReplyText("");
      setActiveReplyReviewId(null);
      // Auto expand replies
      setExpandedReplies((prev) => ({ ...prev, [reviewId]: true }));
    } catch (err) {
      console.error("Failed to submit reply", err);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!currentUserId) return;
    if (!confirm("Are you sure you want to remove this review?")) return;

    try {
      await deleteReview(currentUserId, reviewId);
      await loadReviews();
    } catch (err) {
      console.error("Failed to delete review", err);
    }
  };

  // Delete Reply
  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    if (!currentUserId) return;
    if (!confirm("Are you sure you want to remove this reply?")) return;

    try {
      const updated = await deleteReviewReply(currentUserId, reviewId, replyId);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviews: prev.reviews.map((r) => (r.id === updated.id ? updated : r)),
        };
      });
    } catch (err) {
      console.error("Failed to delete reply", err);
    }
  };

  // Filtered & Sorted Reviews
  const displayedReviews = useMemo(() => {
    if (!data?.reviews) return [];

    let list = [...data.reviews];

    // Star rating filter
    if (selectedStarFilter !== null) {
      list = list.filter((r) => r.rating === selectedStarFilter);
    }

    // Photo filter
    if (filterWithPhotos) {
      list = list.filter((r) => r.photos && r.photos.length > 0);
    }

    // Sort
    list.sort((a, b) => {
      if (sortOption === "helpful") {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      if (sortOption === "highest") {
        return b.rating - a.rating;
      }
      if (sortOption === "lowest") {
        return a.rating - b.rating;
      }
      // "newest"
      const timeA = a.createdAt || "";
      const timeB = b.createdAt || "";
      return timeB.localeCompare(timeA);
    });

    return list;
  }, [data, selectedStarFilter, filterWithPhotos, sortOption]);

  const totalCount = data?.totalReviews || 0;
  const avgRating = data?.averageRating || 0;
  const recRate = data?.recommendationRate || 0;
  const distribution = data?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <section className="mt-12 bg-white/90 backdrop-blur-md border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-md">
      {/* ─── SECTION HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              Verified Feedback
            </span>
            <span className="text-xs text-stone-500">
              {targetType === "HOTEL" ? "Hotel Reviews" : "Flight Experience"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight mt-1 flex items-center gap-2">
            Guest Reviews & Ratings
            {totalCount > 0 && (
              <span className="text-sm font-semibold text-stone-500">({totalCount})</span>
            )}
          </h2>
        </div>

        <Button
          onClick={handleOpenNewReview}
          className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Write a Review
        </Button>
      </div>

      {/* ─── RATING SUMMARY CARD ────────────────────────────────────────────── */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#FAF6EF]/70 border border-stone-200/80 rounded-2xl p-6">
        {/* Left: Big Score Display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2 border-b md:border-b-0 md:border-r border-stone-200/80">
          <div className="text-5xl font-black text-stone-900 tracking-tight">
            {totalCount > 0 ? avgRating.toFixed(1) : "—"}
            <span className="text-xl font-normal text-stone-500"> / 5</span>
          </div>

          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avgRating)
                    ? "text-amber-500 fill-amber-500"
                    : "text-stone-300"
                }`}
              />
            ))}
          </div>

          <p className="text-sm font-bold text-stone-800">
            {avgRating >= 4.5
              ? "Exceptional Experience"
              : avgRating >= 4.0
              ? "Very Good & Recommended"
              : avgRating >= 3.0
              ? "Satisfactory Quality"
              : totalCount > 0
              ? "Mixed Feedback"
              : "No reviews yet"}
          </p>

          <p className="text-xs text-stone-500 mt-1">
            Based on {totalCount} authentic traveler {totalCount === 1 ? "review" : "reviews"}
          </p>

          {totalCount > 0 && recRate > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {recRate}% of travelers recommend this
            </div>
          )}
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isSelected = selectedStarFilter === star;

            return (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setSelectedStarFilter((prev) => (prev === star ? null : star))
                }
                className={`w-full flex items-center gap-3 p-1.5 rounded-lg transition-colors cursor-pointer group ${
                  isSelected ? "bg-amber-100/70" : "hover:bg-stone-200/50"
                }`}
              >
                <div className="flex items-center gap-1 w-16 text-xs font-semibold text-stone-700">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </div>

                <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500 rounded-full group-hover:bg-amber-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-16 text-right text-xs font-medium text-stone-500">
                  {count} ({percentage}%)
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CONTROLS BAR: SORT & FILTER ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        {/* Star & Media Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStarFilter(null)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedStarFilter === null
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
            }`}
          >
            All ({totalCount})
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                setSelectedStarFilter((prev) => (prev === s ? null : s))
              }
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                selectedStarFilter === s
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
              <span className="opacity-70">({distribution[s] || 0})</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setFilterWithPhotos((prev) => !prev)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterWithPhotos
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            With Photos
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-medium text-stone-600">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-stone-800 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="helpful">Most Helpful</option>
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* ─── REVIEW LIST ────────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-6">
        {loading ? (
          <div className="py-12 text-center text-stone-500 text-sm animate-pulse">
            Loading reviews and ratings...
          </div>
        ) : fetchError ? (
          <div className="py-8 text-center text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl">
            {fetchError}
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800">No reviews found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {selectedStarFilter !== null || filterWithPhotos
                ? "No reviews match your selected filter criteria. Try resetting the filters."
                : "Be the first traveler to share your experience and guide others!"}
            </p>
            {(selectedStarFilter !== null || filterWithPhotos) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStarFilter(null);
                  setFilterWithPhotos(false);
                }}
                className="mt-4 text-xs font-bold"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          displayedReviews.map((rev) => {
            const hasUpvoted =
              currentUserId && rev.helpfulUserIds
                ? rev.helpfulUserIds.includes(currentUserId)
                : false;
            const isAuthor = currentUserId === rev.userId;
            const canDelete = isAuthor || isAdmin;
            const canEdit = isAuthor || isAdmin;
            const repliesCount = rev.replies ? rev.replies.length : 0;
            const isRepliesOpen = expandedReplies[rev.id] || false;

            return (
              <article
                key={rev.id}
                className="border border-stone-200/90 rounded-2xl p-5 sm:p-6 bg-white shadow-xs hover:border-stone-300 transition-colors"
              >
                {/* Header: User details, rating & actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      {(rev.userName || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">
                          {rev.userName || "Traveler"}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Verified Traveler
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">
                        Reviewed{" "}
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recently"}
                      </span>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-stone-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-900">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {/* Review Title & Comment */}
                <div className="mt-3.5 space-y-1.5">
                  {rev.title && (
                    <h4 className="text-sm font-bold text-stone-900 leading-snug">
                      {rev.title}
                    </h4>
                  )}
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                </div>

                {/* Photos Grid with Lightbox Trigger */}
                {rev.photos && rev.photos.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {rev.photos.map((photo, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setLightboxImg(photo)}
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-stone-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <img
                          src={photo}
                          alt={`Review photo ${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-semibold bg-black/50 px-1.5 py-0.5 rounded">
                            Zoom
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Flag Alert if flagged */}
                {rev.isFlagged && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      This review has been flagged for moderation: <em>"{rev.flagReason}"</em>
                    </span>
                  </div>
                )}

                {/* Footer Toolbar: Helpful, Reply, Flag, Delete */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Helpful Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(rev)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        hasUpvoted
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-amber-700" : ""}`} />
                      <span>Helpful ({rev.helpfulCount || 0})</span>
                    </button>

                    {/* Toggle Replies */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedReplies((prev) => ({
                          ...prev,
                          [rev.id]: !prev[rev.id],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                      <span>
                        Replies ({repliesCount})
                      </span>
                      {isRepliesOpen ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Report / Flag button */}
                    <button
                      type="button"
                      onClick={() => setFlagModalTarget(rev)}
                      className="text-stone-400 hover:text-amber-700 text-xs font-medium inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Report this review as inappropriate"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>

                    {/* Edit button (Author or Admin only) */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(rev)}
                        className="text-stone-500 hover:text-stone-900 text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200"
                        title="Edit your review"
                      >
                        <Pencil className="w-3 h-3 text-stone-600" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Delete button (Author or Admin only) */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-stone-500 hover:text-red-600 text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer border border-stone-200"
                        title="Delete review"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ─── THREADED REPLIES DRAWER ──────────────────────────────── */}
                {isRepliesOpen && (
                  <div className="mt-4 pt-4 border-t border-stone-100 pl-3 sm:pl-6 space-y-3 bg-stone-50/70 p-4 rounded-2xl">
                    <h5 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                      Community Replies ({repliesCount})
                    </h5>

                    {/* Replies List */}
                    {repliesCount === 0 ? (
                      <p className="text-xs text-stone-500 italic">
                        No replies yet. Be the first to reply to this traveler!
                      </p>
                    ) : (
                      rev.replies.map((rep) => {
                        const canDeleteReply =
                          currentUserId === rep.userId || isAdmin;
                        const isPartnerOrAdmin =
                          rep.userRole?.toUpperCase() === "ADMIN";

                        return (
                          <div
                            key={rep.id}
                            className="bg-white border border-stone-200 rounded-xl p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-800">
                                  {rep.userName || "Traveler"}
                                </span>
                                {isPartnerOrAdmin && (
                                  <span className="bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.2 rounded text-[10px] border border-amber-200">
                                    Official Partner
                                  </span>
                                )}
                                <span className="text-stone-400 text-[11px]">
                                  •{" "}
                                  {rep.createdAt
                                    ? new Date(rep.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "Recently"}
                                </span>
                              </div>

                              {canDeleteReply && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReply(rev.id, rep.id)}
                                  className="text-stone-400 hover:text-red-600 transition-colors"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <p className="text-stone-700 leading-relaxed">
                              {rep.comment}
                            </p>
                          </div>
                        );
                      })
                    )}

                    {/* Add Reply Box */}
                    {activeReplyReviewId === rev.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a constructive reply to this review..."
                          rows={2}
                          className="text-xs bg-white text-stone-900 placeholder:text-stone-400 border-stone-300 focus:ring-2 focus:ring-amber-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActiveReplyReviewId(null);
                              setReplyText("");
                            }}
                            className="text-xs h-7"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={replySubmitting || !replyText.trim()}
                            onClick={() => handleSubmitReply(rev.id)}
                            className="text-xs h-7 bg-stone-900 text-white hover:bg-stone-800"
                          >
                            {replySubmitting ? "Posting..." : "Post Reply"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUserId) {
                            setSignupModalOpen(true);
                          } else {
                            setActiveReplyReviewId(rev.id);
                          }
                        }}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <Send className="w-3 h-3" />
                        Reply to {rev.userName || "this review"}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* ─── MODAL: WRITE A REVIEW ──────────────────────────────────────────── */}
      <Dialog open={writeModalOpen} onOpenChange={setWriteModalOpen}>
        <DialogContent className="max-w-xl bg-white border border-stone-200 text-stone-900 p-6 rounded-3xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-stone-100">
            <DialogTitle className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              {editingReview ? "Edit Your Review" : "Write a Review"}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              {editingReview
                ? `Update your rating and feedback for ${targetName || (targetType === "HOTEL" ? "this Hotel" : "this Flight")}`
                : `Share your genuine feedback for ${targetName || (targetType === "HOTEL" ? "this Hotel" : "this Flight")}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
            {/* Star Rating Picker */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Your Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeVal = hoverRating || rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-stone-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= activeVal
                              ? "text-amber-500 fill-amber-500"
                              : "text-stone-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm font-bold text-stone-800 ml-2">
                  {RATING_LABELS[hoverRating || rating]} ({hoverRating || rating}/5)
                </span>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Headline or Summary
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unforgettable stay with breathtaking views"
                className="text-sm rounded-xl border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </div>

            {/* Detailed Comment */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Detailed Review <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love? How was the service, comfort, cleanliness, and overall experience?"
                rows={4}
                required
                className="text-sm rounded-xl border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Photo Uploads */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Add Photos <span className="text-stone-400 font-normal">(Up to 5 images)</span>
              </label>

              {/* Photo Previews */}
              {uploadedPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {uploadedPhotos.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-300 group"
                    >
                      <img
                        src={img}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedPhotos.length < 5 && (
                <label className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-stone-50/60 hover:bg-amber-50/30 transition-colors">
                  <Camera className="w-5 h-5 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-700">
                    Click to upload travel photos
                  </span>
                  <span className="text-[11px] text-stone-400">
                    PNG, JPG, WebP up to 4MB each
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}

              {photoError && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">{photoError}</p>
              )}
            </div>

            {/* Submit & Cancel */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWriteModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="rounded-xl text-xs font-bold bg-[#C2410C] hover:bg-[#9A3412] text-white px-5 cursor-pointer"
              >
                {submitting
                  ? editingReview
                    ? "Saving Changes..."
                    : "Publishing Review..."
                  : editingReview
                  ? "Save Changes"
                  : "Publish Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: LIGHTBOX FULL IMAGE VIEW ─────────────────────────────────── */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-3xl bg-black/95 border-0 p-2 text-white rounded-2xl flex flex-col items-center">
          <div className="relative w-full max-h-[80vh] flex items-center justify-center overflow-hidden">
            {lightboxImg && (
              <img
                src={lightboxImg}
                alt="Enlarged review photo"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            )}
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: FLAG / REPORT REVIEW ────────────────────────────────────── */}
      <Dialog open={!!flagModalTarget} onOpenChange={() => setFlagModalTarget(null)}>
        <DialogContent className="max-w-md bg-white border border-stone-200 text-stone-900 p-6 rounded-2xl shadow-xl">
          <DialogHeader className="pb-2 border-b border-stone-100">
            <DialogTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Report Review to Moderators
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Help us keep MakeMyTour safe, trusted, and helpful for all travelers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-stone-700">
              Reason for reporting:
            </label>

            {[
              "Spam or fraudulent content",
              "Offensive, abusive, or discriminatory language",
              "False, misleading, or deceptive review",
              "Irrelevant or off-topic commentary",
              "Privacy violation or personal data disclosure",
            ].map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  name="flagReason"
                  value={reason}
                  checked={flagReason === reason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="accent-amber-600"
                />
                <span className="text-stone-800 font-medium">{reason}</span>
              </label>
            ))}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlagModalTarget(null)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleFlagReview}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── AUTH SIGNUP DIALOG ──────────────────────────────────────────────── */}
      <SignupDialog
        open={signupModalOpen}
        onOpenChange={setSignupModalOpen}
        initialMode="login"
      />
    </section>
  );
}
