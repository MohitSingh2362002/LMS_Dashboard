import { getFullImageUrl, stripHtml, formatDate } from "../utils/helpers";

/**
 * BrowseCourseCard — admin-style course card for learner/parent browse pages.
 *
 * Props:
 *   course        – full course object
 *   isEnrolled    – bool (learner is already enrolled)
 *   onEnrollClick – called with course when Enroll/Buy is clicked
 *   enrolledLabel – text override when already enrolled (default "Enrolled ✓")
 *   onContinue    – optional fn called when "Continue" clicked (learner only)
 */

const CATEGORY_TAG = {
  development: "bg-emerald-100 text-emerald-700",
  engineering: "bg-blue-100 text-blue-700",
  design:      "bg-pink-100 text-pink-700",
  data:        "bg-violet-100 text-violet-700",
  default:     "bg-slate-100 text-slate-700",
};

const STATUS_BADGE = {
  published: "bg-emerald-500 text-white",
  draft:     "bg-amber-500 text-white",
  archived:  "bg-slate-500 text-white",
};

const IcStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-yellow-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const BrowseCourseCard = ({ course, isEnrolled, onEnrollClick, enrolledLabel, onContinue }) => {
  const isFree = course.pricing?.type === "free" || !(course.pricing?.amount > 0);
  const price  = isFree ? "Free" : `₹${course.pricing?.amount}`;
  const cat    = (course.category || course.tags?.[0] || "default").toLowerCase();
  const tagCls = CATEGORY_TAG[cat] || CATEGORY_TAG.default;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition-all hover:shadow-cardHover hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-brand-accent to-brand-primary">
        {course.thumbnail ? (
          <img
            src={getFullImageUrl(course.thumbnail)}
            alt={course.title}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-12 w-12 opacity-60">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
        )}

        {/* Status badge */}
        <span className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[course.status] || STATUS_BADGE.draft}`}>
          {course.status}
        </span>

        {/* Pricing badge */}
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-sm ${isFree ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"}`}>
          {price}
        </span>

        {/* Enrolled overlay */}
        {isEnrolled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow">
              ✓ {enrolledLabel || "Enrolled"}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Category tag */}
        <span className={`mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tagCls}`}>
          {cat}
        </span>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold text-brand-ink leading-snug">{course.title}</h3>

        {/* Tagline */}
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {stripHtml(course.tagline || course.description) || "—"}
        </p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-0.5">
          {[1,2,3,4,5].map((s) => <IcStar key={s} />)}
          <span className="ml-1 text-[10px] text-slate-400">4.5</span>
        </div>

        {/* Instructor */}
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary">
            {(course.instructor?.name || course.instructorDisplayName || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-brand-ink">
              {course.instructorDisplayName || course.instructor?.name || "Faculty"}
            </p>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">{formatDate(course.updatedAt)}</span>
        </div>

        {/* Enrollment count + exam pattern */}
        <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
          {course.enrollmentCount ?? 0} enrolled
          {course.examPattern && (
            <>
              <span className="text-slate-300">·</span>
              <span className="rounded-full bg-brand-surface px-1.5 py-0.5 font-semibold text-brand-primary">
                {course.examPattern}
              </span>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4">
          {isEnrolled ? (
            <button
              onClick={() => onContinue && onContinue(course)}
              className="w-full rounded-xl border border-brand-primary py-2 text-center text-xs font-bold text-brand-primary hover:bg-brand-surface transition"
            >
              {enrolledLabel || "Enrolled ✓"}
            </button>
          ) : (
            <button
              onClick={() => onEnrollClick(course)}
              className={`w-full rounded-xl py-2 text-center text-xs font-bold text-white transition ${
                isFree
                  ? "bg-brand-primary hover:bg-brand-ink"
                  : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {isFree ? "Enroll Free" : `Buy · ${price}`}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default BrowseCourseCard;
