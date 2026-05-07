import { useState } from "react";
import toast from "react-hot-toast";

/**
 * CourseEnrollModal — purchase confirmation dialog for a paid course.
 *
 * Props:
 *   course      – course object { _id, title, pricing, thumbnail, instructor }
 *   role        – "learner" | "parent"
 *   linkedLearners – (parent only) array of { _id, name } linked learners
 *   onClose     – dismiss
 *   onEnrolled  – called after successful enrollment (receives course._id)
 *   enrollFn    – async (courseId, learnerId?) → enrollment. Provided by parent page.
 */
const CourseEnrollModal = ({ course, role, linkedLearners = [], onClose, onEnrolled, enrollFn }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(linkedLearners[0]?._id || "");

  const isFree = course.pricing?.type === "free" || !(course.pricing?.amount > 0);
  const price  = isFree ? "Free" : `₹${course.pricing?.amount}`;
  const isParent = role === "parent";

  const handleEnroll = async () => {
    if (isParent && !selectedLearner) {
      toast.error("Please select a learner to enroll");
      return;
    }
    setEnrolling(true);
    try {
      await enrollFn(course._id, selectedLearner || undefined);
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

        {/* Price */}
        <div className={`mt-4 rounded-2xl border p-4 text-center ${isFree ? "bg-emerald-50 border-emerald-100" : "bg-violet-50 border-violet-100"}`}>
          <p className={`text-2xl font-extrabold ${isFree ? "text-emerald-700" : "text-violet-700"}`}>{price}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isFree ? "Free access · Start immediately" : "One-time payment · Lifetime access"}
          </p>
        </div>

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
            {enrolling ? "Processing…" : isFree ? "Enroll Free" : `Pay ${price}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollModal;
