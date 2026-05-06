import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { CourseThumbnail } from "../../components/learner/LearnerPortalUI";

/* ── Helpers ──────────────────────────────────────────────────────────── */
const fmtDate = (val) => {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const progressColor = (pct) => {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#1A4FA0";
  return "#F59E0B";
};

const GROUP_BADGE = {
  foundation: "bg-slate-100 text-slate-600",
  growth:     "bg-amber-100 text-amber-700",
  merit:      "bg-emerald-100 text-emerald-700",
  ranker:     "bg-brand-surface text-brand-primary",
};

/* ── Batch Card ───────────────────────────────────────────────────────── */
const BatchCard = ({ batch, enrollment, expired, onEnrolled }) => {
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();
  const course   = batch.course;
  const pct      = Math.min(100, enrollment?.progress ?? batch.syllabusProgress ?? 0);
  const pColor   = progressColor(pct);

  const handleStudy = async () => {
    if (enrollment?._id) {
      // Already enrolled — navigate directly to course viewer
      navigate(`/learner/courses/${enrollment._id}`);
      return;
    }
    if (!course?._id) {
      toast.error("No course linked to this batch yet.");
      return;
    }
    // Auto-enroll then navigate
    setEnrolling(true);
    try {
      const { data } = await api.post("/enrollments", { courseId: course._id });
      toast.success("Enrolled! Starting your course…");
      if (onEnrolled) onEnrolled(data);
      navigate(`/learner/courses/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:shadow-cardHover">
      {/* Thumbnail */}
      <div className="relative h-44">
        <CourseThumbnail
          title={course?.title || batch.name}
          thumbnail={course?.thumbnail}
          className="h-full"

          zoom
        />
        {/* Performance group badge */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${GROUP_BADGE[batch.performanceGroup] || "bg-slate-100 text-slate-600"}`}>
          {batch.performanceGroup}
        </span>
        {/* Expired overlay */}
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-red-600">Archived</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="line-clamp-2 text-sm font-extrabold text-brand-ink leading-snug">
          {course?.title || batch.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-500 truncate">{batch.name}</p>

        {/* Dates */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400 font-medium">Start Date</p>
            <p className="font-bold text-brand-ink">{fmtDate(batch.createdAt)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-slate-400 font-medium">Last Updated</p>
            <p className="font-bold text-brand-ink">{fmtDate(batch.updatedAt)}</p>
          </div>
        </div>

        {/* Syllabus Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Syllabus Progress</span>
            <span className="font-bold" style={{ color: pColor }}>{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pColor }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {pct === 0 ? "Not started yet" :
             pct === 100 ? "Fully covered ✓" :
             pct >= 75 ? "Final stretch" :
             pct >= 50 ? "Midway through" :
             "In progress"}
          </p>
        </div>

        {/* Learner count */}
        {batch.learners?.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex">
              {batch.learners.slice(0, 4).map((l, i) => (
                <div
                  key={l._id || i}
                  title={l.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-surface text-[9px] font-bold text-brand-primary -ml-1 first:ml-0"
                  style={{ zIndex: 4 - i }}
                >
                  {(l.name || "?").slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">{batch.learners.length} student{batch.learners.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* CTA */}
        {expired ? (
          <div className="mt-4 rounded-xl border border-slate-200 py-2 text-center text-xs font-bold text-slate-400">
            Batch Archived
          </div>
        ) : (
          <button
            onClick={handleStudy}
            disabled={enrolling}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white hover:bg-brand-ink disabled:opacity-60 transition"
          >
            {enrolling ? "Enrolling…" : "Let's Study"}
            {!enrolling && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
      </div>
    </article>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────── */
const LearnerBatchesPage = () => {
  const [priceTab,  setPriceTab]  = useState("paid");
  const [statusTab, setStatusTab] = useState("all");

  const { data: batches,     loading }                      = useFetch(() => api.get("/batches/mine"), []);
  const { data: enrollments, loading: loadingEnroll, refresh: refreshEnroll } = useFetch(() => api.get("/enrollments/mine"), []);

  const batchCards = useMemo(() => {
    const byCoursId = new Map(enrollments.map((e) => [String(e.course?._id), e]));
    return batches.map((b) => ({
      batch:      b,
      enrollment: byCoursId.get(String(b.course?._id)),
      isFree:     b.course?.pricing?.type === "free",
      expired:    b.status === "archived",
    }));
  }, [batches, enrollments]);

  const filtered = useMemo(() => batchCards.filter((item) => {
    const priceOk  = priceTab === "free" ? item.isFree : !item.isFree;
    const statusOk = statusTab === "expired" ? item.expired : true;
    return priceOk && statusOk;
  }), [batchCards, priceTab, statusTab]);

  const paidCount   = batchCards.filter((i) => !i.isFree).length;
  const freeCount   = batchCards.filter((i) => i.isFree).length;
  const expiredCount = batchCards.filter((i) => i.expired).length;

  if (loading || loadingEnroll) return <Loader label="Loading your batches…" />;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-ink">My Batches</h1>
        <p className="mt-1 text-sm text-slate-500">
          {batchCards.length} batch{batchCards.length !== 1 ? "es" : ""} assigned to you
        </p>
      </div>

      {/* ── Filters card ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
        {/* Paid / Free toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { key: "paid", label: `Paid (${paidCount})` },
            { key: "free", label: `Free (${freeCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPriceTab(key)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                priceTab === key
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-slate-500 hover:text-brand-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* All / Expired subtabs */}
        <div className="mt-4 flex gap-6 border-b border-slate-200 pb-0">
          {[
            { key: "all",     label: "All" },
            { key: "expired", label: `Expired (${expiredCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusTab(key)}
              className={`border-b-2 pb-3 text-sm font-bold transition ${
                statusTab === key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-brand-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {!batchCards.length ? (
        <EmptyState
          title="No batch assigned yet"
          description="Your batch will appear here once an admin adds you to one."
        />
      ) : !filtered.length ? (
        <EmptyState
          title={`No ${statusTab === "expired" ? "expired " : ""}${priceTab} batches`}
          description="Switch tabs to see other assigned batches."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ batch, enrollment, expired }) => (
            <BatchCard
              key={batch._id}
              batch={batch}
              enrollment={enrollment}
              expired={expired}
              onEnrolled={refreshEnroll}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerBatchesPage;
