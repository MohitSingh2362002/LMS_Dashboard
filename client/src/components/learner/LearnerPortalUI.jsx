import { useState } from "react";
import { Link } from "react-router-dom";
import { getFullImageUrl, stripHtml } from "../../utils/helpers";

/* ────────────────────────────────────────────────────────────────────────
   CourseThumbnail
   • Real thumbnail  → shows the actual image (with optional hover-zoom)
   • No thumbnail + variant="course" (default) → gradient + initials
   • No thumbnail + variant="test"             → /placeholder-test.svg

   Props:
     title     — drives gradient colour & initials (course) / alt text (test)
     thumbnail — raw DB path ("/uploads/…") or falsy
     className — applied to the wrapper div (set the height here)
     alt       — overrides img alt text
     zoom      — adds group-hover scale on real images
     variant   — "course" (default) | "test"
──────────────────────────────────────────────────────────────────────── */
const GRADIENTS = [
  ["#1A4FA0", "#2E7FD9"],   // brand blue
  ["#7C3AED", "#A855F7"],   // violet
  ["#059669", "#10B981"],   // emerald
  ["#DC2626", "#F97316"],   // red → orange
  ["#D97706", "#F59E0B"],   // amber
  ["#0891B2", "#06B6D4"],   // cyan
  ["#DB2777", "#EC4899"],   // pink
  ["#0F766E", "#14B8A6"],   // teal
];

export const CourseThumbnail = ({
  title = "",
  thumbnail,
  className = "h-44",
  alt,
  zoom = false,
  variant = "course",
}) => {
  const src     = getFullImageUrl(thumbnail);
  const zoomCls = zoom ? " group-hover:scale-105 transition-transform duration-500" : "";

  // Track whether the real image failed to load
  const [imgError, setImgError] = useState(false);

  const showGradient = variant !== "test" && (!src || imgError);
  const showTestImg  = variant === "test"  && (!src || imgError);

  /* ── Mock-test: always use the placeholder SVG when no real image ── */
  if (showTestImg) {
    return (
      <div className={`${className} overflow-hidden bg-[#0F2C5A]`}>
        <img
          src="/placeholder-test.svg"
          alt={alt || title || "Mock Test"}
          className={`h-full w-full object-cover${zoomCls}`}
        />
      </div>
    );
  }

  /* ── Course / batch: real image with error → gradient fallback ── */
  if (!showGradient) {
    return (
      <div className={`${className} overflow-hidden`}>
        <img
          src={src}
          alt={alt || title}
          className={`h-full w-full object-cover${zoomCls}`}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  /* ── Gradient placeholder ── */
  const idx      = title ? title.charCodeAt(0) % GRADIENTS.length : 0;
  const [c1, c2] = GRADIENTS[idx];
  const initials = title
    .split(" ").filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2).join("") || "?";

  return (
    <div
      className={`${className} relative flex flex-col items-center justify-center overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
    >
      {/* Dot-grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Glow blob */}
      <div
        className="absolute"
        style={{
          width: "55%", height: "55%", borderRadius: "50%",
          background: "rgba(255,255,255,0.10)", filter: "blur(18px)",
        }}
      />
      {/* Initials badge */}
      <div
        className="relative flex items-center justify-center rounded-2xl"
        style={{
          width: 64, height: 64,
          background: "rgba(255,255,255,0.22)",
          backdropFilter: "blur(4px)",
          border: "1.5px solid rgba(255,255,255,0.35)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}
      >
        <span
          className="select-none font-black tracking-tight text-white"
          style={{ fontSize: 26, lineHeight: 1, textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
        >
          {initials}
        </span>
      </div>
      {title && (
        <p
          className="relative mt-3 max-w-[78%] text-center font-semibold leading-snug text-white line-clamp-2"
          style={{ fontSize: 11, opacity: 0.82 }}
        >
          {title}
        </p>
      )}
    </div>
  );
};

export const LearnerPageTitle = ({ title, subtitle }) => (
  <div>
    <h2 className="text-4xl font-bold tracking-tight text-brand-primary">{title}</h2>
    {subtitle ? <p className="mt-2 text-base text-slate-600">{subtitle}</p> : null}
  </div>
);

export const LearnerStatCard = ({ label, value, helper, tone = "blue" }) => {
  const toneClass = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "text-brand-primary";
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-7 shadow-card">
      <p className="text-sm text-brand-ink">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
};

export const CourseImage = ({ course, className = "h-44" }) => (
  <div className={`${className} overflow-hidden rounded border border-slate-200`}>
    <CourseThumbnail
      title={course?.title}
      thumbnail={course?.thumbnail}
      className="h-full"

    />
  </div>
);

export const BatchProductCard = ({ enrollment, batch, actionLabel = "Let's Study" }) => {
  const course = enrollment?.course || batch?.course;
  return (
    <article className="rounded-lg border border-slate-300 bg-white p-5 shadow-card">
      <h3 className="line-clamp-2 text-xl font-bold text-brand-ink">{course?.title || batch?.name || "Course"}</h3>
      <div className="mt-5">
        <CourseImage course={course} className="h-48" />
      </div>
      <div className="mt-5 flex items-start gap-3 text-slate-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-5 w-5 shrink-0">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
        </svg>
        <p className="text-lg">
          Updated {new Date(enrollment?.updatedAt || batch?.updatedAt || course?.updatedAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>
      <Link to={enrollment?._id ? `/learner/courses/${enrollment._id}` : "/learner"} className="mt-7 block rounded bg-brand-primary px-4 py-4 text-center text-lg font-bold text-white transition hover:bg-[#0b3d86]">
        {actionLabel}
      </Link>
    </article>
  );
};

export const TestSeriesCard = ({ test, attempt, isFree }) => {
  const scorePct = attempt?.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null;
  return (
    <article className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
      <div className="relative h-56">
        <CourseThumbnail
          title={test.title}
          thumbnail={test.course?.thumbnail}
          className="h-full"
          variant="test"
        />
        <span className="absolute right-4 top-4 rounded bg-yellow-400 px-3 py-1 text-xs font-bold text-black">NEW</span>
      </div>
      <div className="p-6">
        <h3 className="min-h-[3.25rem] text-2xl font-bold leading-tight text-brand-ink">{test.title}</h3>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>{test.examPattern || "Mock"} exam simulation</p>
          <p>Conducted in English and Hindi</p>
          <p>Total Tests - {test.questions?.length || 0} questions</p>
          {test.batch?.name ? <p>Batch - {test.batch.name}</p> : null}
        </div>
        <p className="mt-8 text-2xl font-bold text-indigo-600">{isFree ? "Free" : "Paid"}</p>
        {scorePct !== null ? <p className="mt-1 text-xs font-semibold text-emerald-600">Last score {scorePct}%</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link to={`/learner/exam/tests/${test._id}`} className="rounded border border-indigo-600 px-4 py-3 text-center text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
            EXPLORE
          </Link>
          <Link to={`/learner/exam/tests/${test._id}`} className="rounded bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-indigo-700">
            {attempt ? "REATTEMPT" : isFree ? "ENROLL NOW" : "START TEST"}
          </Link>
        </div>
      </div>
    </article>
  );
};

export const compactCourseText = (course) => stripHtml(course?.tagline || course?.description || "");
