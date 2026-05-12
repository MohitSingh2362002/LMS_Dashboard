import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { CourseThumbnail } from "../../components/learner/LearnerPortalUI";

/* ── Helpers ──────────────────────────────────────────────────────────── */
const progressColor = (pct) => {
  if (pct >= 80) return { bar: "#10B981", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (pct >= 40) return { bar: "#1A4FA0", text: "text-brand-primary", bg: "bg-brand-surface" };
  return { bar: "#F59E0B", text: "text-amber-600", bg: "bg-amber-50" };
};

const statusLabel = (pct) => {
  if (pct >= 100) return { label: "Completed", cls: "bg-emerald-100 text-emerald-700" };
  if (pct > 0)    return { label: "In Progress", cls: "bg-brand-surface text-brand-primary" };
  return { label: "Not Started", cls: "bg-slate-100 text-slate-500" };
};

/* ── Course Card ──────────────────────────────────────────────────────── */
const CourseCard = ({ enrollment }) => {
  const course = enrollment.course;
  const pct    = Math.min(100, enrollment.progress || 0);
  const color  = progressColor(pct);
  const status = statusLabel(pct);
  return (
    <article className="group flex overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:shadow-cardHover hover:-translate-y-0.5 sm:block">
      {/* Thumbnail */}
      <div className="relative h-40 w-28 shrink-0 sm:h-52 sm:w-auto">
        <CourseThumbnail
          title={course?.title}
          thumbnail={course?.thumbnail}
          className="h-full"
          zoom
        />
        {/* Status badge */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.cls}`}>
          {status.label}
        </span>
        {/* Progress % */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color.bar }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 p-3 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {course?.instructorDisplayName || course?.instructor?.name || "Faculty"}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-brand-ink">
          {course?.title || "Course"}
        </h3>

        {/* Tags */}
        {course?.tags?.length > 0 && (
          <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
            {course.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-3 sm:mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Progress</span>
            <span className={`font-bold ${color.text}`}>{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: color.bar }}
            />
          </div>
          <p className="mt-1 hidden text-[10px] text-slate-400 sm:block">
            {enrollment.completedPages?.length || 0} of {course?.pages?.length || 0} pages completed
          </p>
        </div>

        {/* CTA */}
        <Link
          to={`/learner/courses/${enrollment._id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-ink sm:mt-4 sm:py-2.5"
        >
          {pct === 0 ? "Start Learning" : pct >= 100 ? "Review Course" : "Continue Learning"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────── */
const LearnerMyCoursesPage = () => {
  const [filter, setFilter] = useState("all");
  const { data: enrollments, loading } = useFetch(() => api.get("/enrollments/mine"), []);

  const filtered = useMemo(() => {
    if (filter === "completed")   return enrollments.filter((e) => e.progress >= 100);
    if (filter === "inprogress")  return enrollments.filter((e) => e.progress > 0 && e.progress < 100);
    if (filter === "notstarted")  return enrollments.filter((e) => !e.progress || e.progress === 0);
    return enrollments;
  }, [enrollments, filter]);

  const counts = useMemo(() => ({
    all:        enrollments.length,
    inprogress: enrollments.filter((e) => e.progress > 0 && e.progress < 100).length,
    completed:  enrollments.filter((e) => e.progress >= 100).length,
    notstarted: enrollments.filter((e) => !e.progress || e.progress === 0).length,
  }), [enrollments]);

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
    : 0;

  if (loading) return <Loader label="Loading your courses…" />;

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">My Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            {enrollments.length} course{enrollments.length !== 1 ? "s" : ""} enrolled · {avgProgress}% average progress
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {enrollments.length > 0 && (
        <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {[
            { key: "all",       label: "All Courses",  val: counts.all,        color: "text-brand-primary" },
            { key: "inprogress",label: "In Progress",  val: counts.inprogress, color: "text-amber-600"    },
            { key: "completed", label: "Completed",    val: counts.completed,  color: "text-emerald-600"  },
            { key: "notstarted",label: "Not Started",  val: counts.notstarted, color: "text-slate-500"    },
          ].map(({ key, label, val, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`w-32 shrink-0 rounded-2xl border p-3 text-center transition sm:w-auto sm:p-4 ${
                filter === key
                  ? "border-brand-primary bg-brand-surface shadow-sm"
                  : "border-slate-200 bg-white hover:border-brand-primary/30"
              }`}
            >
              <p className={`text-xl font-extrabold sm:text-2xl ${filter === key ? "text-brand-primary" : color}`}>{val}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-500 sm:text-[11px]">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      {!enrollments.length ? (
        <EmptyState
          title="No courses enrolled yet"
          description="You'll see your enrolled courses here. Browse available batches to get started."
        />
      ) : !filtered.length ? (
        <EmptyState
          title={`No ${filter === "inprogress" ? "in-progress" : filter === "notstarted" ? "not-started" : filter} courses`}
          description="Switch filter to see other courses."
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((e) => (
            <CourseCard key={e._id} enrollment={e} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerMyCoursesPage;
