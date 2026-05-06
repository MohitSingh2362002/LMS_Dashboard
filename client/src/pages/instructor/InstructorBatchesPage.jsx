import { useMemo, useState } from "react";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const GROUP_BADGE = {
  foundation: "bg-slate-100 text-slate-700",
  growth:     "bg-amber-100 text-amber-700",
  merit:      "bg-emerald-100 text-emerald-700",
  ranker:     "bg-brand-surface text-brand-primary",
};

// Deterministic progress from batch creation date (proxy for syllabus coverage)
const syllabusProgress = (batch) => {
  const days = Math.floor((Date.now() - new Date(batch.createdAt)) / (1000 * 60 * 60 * 24));
  return Math.min(Math.round((days / 180) * 100), 98);
};

const progressColor = (pct) => {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#1A4FA0";
  return "#F59E0B";
};

const InstructorBatchesPage = () => {
  const [tab, setTab] = useState("active");
  const { data: batches, loading } = useFetch(() => api.get("/batches"), []);

  const batchArr = Array.isArray(batches) ? batches : [];

  const activeBatches    = useMemo(() => batchArr.filter((b) => b.status === "active" && (b.learners?.length || 0) > 0), [batchArr]);
  const upcomingBatches  = useMemo(() => batchArr.filter((b) => b.status === "active" && !(b.learners?.length)), [batchArr]);
  const completedBatches = useMemo(() => batchArr.filter((b) => b.status === "archived"), [batchArr]);
  const displayBatches   = tab === "active" ? activeBatches : tab === "upcoming" ? upcomingBatches : completedBatches;

  const trackCount = useMemo(
    () => new Set(batchArr.map((b) => b.course?._id).filter(Boolean)).size,
    [batchArr]
  );

  if (loading) return <Loader label="Loading batch portfolio..." />;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Active Batch Portfolio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring {batchArr.length} assigned batch{batchArr.length !== 1 ? "es" : ""} across {trackCount} curriculum track{trackCount !== 1 ? "s" : ""}.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {[
            { key: "active",    label: `Active (${activeBatches.length})` },
            { key: "upcoming",  label: `Upcoming (${upcomingBatches.length})` },
            { key: "completed", label: `Completed (${completedBatches.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-brand-ink text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-brand-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Batch Grid ── */}
      {!displayBatches.length ? (
        <EmptyState
          title={`No ${tab} batches`}
          description={
            tab === "upcoming"
              ? "Batches with no learners yet will appear here."
              : tab === "completed"
              ? "Archived batches will appear here."
              : "Active batches assigned to you will appear here."
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayBatches.map((batch) => {
            const progress     = syllabusProgress(batch);
            const learnerCount = batch.learners?.length || 0;
            const pColor       = progressColor(progress);

            return (
              <div
                key={batch._id}
                className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card hover:shadow-md transition-shadow"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-brand-primary truncate">{batch.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {batch.course?.title || "No course assigned"}
                    </p>
                    {batch.course?.status && (
                      <p className="mt-0.5 text-[10px] capitalize text-slate-400">{batch.course.status}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${GROUP_BADGE[batch.performanceGroup] || "bg-slate-100 text-slate-600"}`}>
                    {batch.performanceGroup}
                  </span>
                </div>

                {/* Learner count pill */}
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-brand-surface px-3 py-2 text-sm font-semibold text-brand-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5L2 10z" />
                    </svg>
                    {learnerCount} Student{learnerCount !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Syllabus progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Syllabus Progress</span>
                    <span className="font-bold" style={{ color: pColor }}>{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: pColor }}
                    />
                  </div>
                </div>

                {/* Learner avatar strip */}
                {batch.learners?.length > 0 && (
                  <div className="mt-4 flex items-center">
                    {batch.learners.slice(0, 6).map((l, i) => (
                      <div
                        key={l._id}
                        title={l.name}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-surface text-[10px] font-bold text-brand-primary -ml-1 first:ml-0 ring-1 ring-slate-200"
                        style={{ zIndex: 6 - i }}
                      >
                        {(l.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {batch.learners.length > 6 && (
                      <span className="ml-2 text-[10px] font-semibold text-slate-400">
                        +{batch.learners.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorBatchesPage;
