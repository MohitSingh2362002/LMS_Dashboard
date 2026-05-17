import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

/**
 * CourseEnrollModal — purchase confirmation dialog for a paid course.
 *
 * Props:
 *   course         – course object { _id, title, pricing, thumbnail, instructor }
 *   role           – "learner" | "parent"
 *   linkedLearners – (parent only) array of { _id, name } linked learners
 *   onClose        – dismiss
 *   onEnrolled     – called after successful enrollment (receives course._id)
 *   enrollFn       – async (courseId, learnerId?) → enrollment. Provided by parent page.
 */
const CourseEnrollModal = ({ course, role, linkedLearners = [], onClose, onEnrolled, enrollFn }) => {
  const [enrolling, setEnrolling]       = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(linkedLearners[0]?._id || "");

  // Promo code
  const [promoCode,    setPromoCode]    = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult,  setPromoResult]  = useState(null);  // { valid, discount, finalAmount, message }
  const [promoError,   setPromoError]   = useState("");

  const isFree   = course.pricing?.type === "free" || !(course.pricing?.amount > 0);
  const basePrice = course.pricing?.amount ?? 0;
  const finalPrice = promoResult?.valid ? promoResult.finalAmount : basePrice;
  const isParent  = role === "parent";

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const { data } = await api.post("/promo-codes/validate", {
        code:   promoCode.trim(),
        type:   "course",
        amount: basePrice,
      });
      setPromoResult(data);
    } catch (err) {
      setPromoError(err?.response?.data?.message ?? "Invalid promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (isParent && !selectedLearner) {
      toast.error("Please select a learner to enroll");
      return;
    }
    setEnrolling(true);
    try {
      await enrollFn(course._id, selectedLearner || undefined);
      // Increment promo usage after successful enrollment
      if (promoResult?.valid && promoCode.trim()) {
        api.post("/promo-codes/apply", { code: promoCode.trim() }).catch(() => {});
      }
      toast.success(isFree ? "Enrolled successfully!" : "Purchase successful! Course is now accessible.");
      onEnrolled(course._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Enrollment failed. Try again.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel"
      >
        {/* Thumbnail preview */}
        {course.thumbnail && (
          <div className="mb-4 h-28 w-full overflow-hidden rounded-xl bg-slate-100">
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.parentElement.style.display = "none"; }} />
          </div>
        )}

        {/* Icon (if no thumbnail) */}
        {!course.thumbnail && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface mx-auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-brand-primary">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
        )}

        <h3 className="text-center text-base font-extrabold text-brand-ink line-clamp-2">{course.title}</h3>
        {course.instructor?.name && (
          <p className="mt-0.5 text-center text-xs text-slate-500">by {course.instructorDisplayName || course.instructor?.name}</p>
        )}

        {/* Price block */}
        <div className={`mt-4 rounded-2xl border p-4 text-center ${isFree ? "bg-emerald-50 border-emerald-100" : "bg-violet-50 border-violet-100"}`}>
          {!isFree && promoResult?.valid ? (
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-bold text-slate-400 line-through">₹{basePrice}</p>
              <p className="text-2xl font-extrabold text-emerald-600">₹{finalPrice}</p>
            </div>
          ) : (
            <p className={`text-2xl font-extrabold ${isFree ? "text-emerald-700" : "text-violet-700"}`}>
              {isFree ? "Free" : `₹${basePrice}`}
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isFree ? "Free access · Start immediately" : "One-time payment · Lifetime access"}
          </p>
          {promoResult?.valid && (
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">
              🎉 {promoResult.message}
            </p>
          )}
        </div>

        {/* Promo code input — paid courses only */}
        {!isFree && (
          <div className="mt-3">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
              promoResult?.valid ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50"
            }`}>
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoResult(null);
                  setPromoError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                placeholder="Promo code"
                className="flex-1 bg-transparent text-sm font-bold tracking-wider text-brand-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="shrink-0 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {promoLoading ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : "Apply"}
              </button>
            </div>
            {promoError && (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{promoError}</p>
            )}
          </div>
        )}

        {/* Parent: learner selector */}
        {isParent && linkedLearners.length > 0 && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-brand-ink">Enroll for</label>
            <select
              value={selectedLearner}
              onChange={(e) => setSelectedLearner(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none"
            >
              {linkedLearners.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
            Full course access forever
          </div>
          {isParent && (
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
              Automatically linked to your child's account
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
            Track progress in your dashboard
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={enrolling || (isParent && !selectedLearner)}
            className={`rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50 transition ${
              isFree ? "bg-brand-primary hover:bg-brand-ink" : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {enrolling
              ? "Processing…"
              : isFree
                ? "Enroll Free"
                : `Pay ₹${finalPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollModal;
