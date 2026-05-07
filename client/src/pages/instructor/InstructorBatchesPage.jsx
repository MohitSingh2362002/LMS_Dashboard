import { useMemo, useState } from "react";
import toast from "react-hot-toast";
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

const progressBarColor = (pct) => {
  if (pct >= 80) return "#10B981";
  if (pct >= 50) return "#1A4FA0";
  return "#F59E0B";
};

/* ── Update Progress Modal ──────────────────────────────────────────
   Lets the instructor set an exact 0-100 syllabus % for a batch.
   Shows topic checkboxes derived from the course pages count so the
   instructor gets visual milestones; the final % is what's saved.
────────────────────────────────────────────────────────────────────── */
const UpdateProgressModal = ({ batch, onClose, onSaved }) => {
  const totalPages   = batch.course?.pages?.length || 0;
  const initialValue = batch.syllabusProgress ?? 0;
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // Derive milestone checkpoints from page count (max 8 shown)
  const milestones = useMemo(() => {
    if (!totalPages) return [];
    const count = Math.min(totalPages, 8);
    return Array.from({ length: count }, (_, i) => ({
      label: `Page ${i + 1}${totalPages > 8 && i === 7 ? "+" : ""}`,
      threshold: Math.round(((i + 1) / count) * 100),
    }));
  }, [totalPages]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/batches/${batch._id}/syllabus`, {
        syllabusProgress: value,
      });
      toast.success("Syllabus progress updated");
      onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-brand-ink">Update Syllabus Progress</h3>
            <p className="mt-0.5 text-xs text-slate-500">{batch.name} · {batch.course?.title || "No course"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Coverage</span>
            <span className="text-2xl font-bold" style={{ color: progressBarColor(value) }}>
              {value}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full cursor-pointer accent-brand-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Progress bar preview */}
        <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${value}%`, backgroundColor: progressBarColor(value) }}
          />
        </div>

        {/* Milestone checkpoints (from course pages) */}
        {milestones.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Course Milestones ({totalPages} pages)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {milestones.map((m) => (
                <button
                  key={m.threshold}
                  type="button"
                  onClick={() => setValue(m.threshold)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    value >= m.threshold
                      ? "border-brand-primary/30 bg-brand-surface text-brand-primary"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${value >= m.threshold ? "bg-brand-primary" : "bg-slate-300"}`} />
                  {m.label}
                  <span className="ml-auto font-bold">{m.threshold}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick-set buttons */}
        <div className="mb-5 flex gap-2">
          {[0, 25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setValue(pct)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                value === pct
                  ? "border-brand-primary bg-brand-surface text-brand-primary"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || value === initialValue}
            className="flex-1 rounded-xl bg-brand-primary py-2.5 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-60 transition"
          >
            {saving ? "Saving…" : "Save Progress"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────────── */
const InstructorBatchesPage = () => {
  const [tab, setTab]               = useState("active");
  const [editingBatch, setEditing]  = useState(null);

  const { data: batches, loading, setData: setBatches } = useFetch(() => api.get("/batches"), []);
  const batchArr = Array.isArray(batches) ? batches : [];

  const activeBatches    = useMemo(() => batchArr.filter((b) => b.status === "active" && (b.learners?.length || 0) > 0), [batchArr]);
  const upcomingBatches  = useMemo(() => batchArr.filter((b) => b.status === "active" && !(b.learners?.length)), [batchArr]);
  const completedBatches = useMemo(() => batchArr.filter((b) => b.status === "archived"), [batchArr]);
  const displayBatches   = tab === "active" ? activeBatches : tab === "upcoming" ? upcomingBatches : completedBatches;

  const trackCount = useMemo(
    () => new Set(batchArr.map((b) => b.course?._id).filter(Boolean)).size,
    [batchArr]
  );

  const handleSaved = (updated) => {
    setBatches((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
  };

  if (loading) return <Loader label="Loading batch portfolio…" />;

  return (
    <div className="space-y-6">
      {editingBatch && (
        <UpdateProgressModal
          batch={editingBatch}
          onClose={() => setEditing(null)}
          onSaved={(updated) => { handleSaved(updated); setEditing(null); }}
        />
      )}

      {/* ── Header + tabs ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">Active Batch Portfolio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring {batchArr.length} assigned batch{batchArr.length !== 1 ? "es" : ""} across {trackCount} curriculum track{trackCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {[
            { key: "active",    label: `Active (${activeBatches.length})` },
            { key: "upcoming",  label: `Upcoming (${upcomingBatches.length})` },
            { key: "completed", label: `Completed (${completedBatches.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition ${
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

      {/* ── Batch grid ── */}
      {!displayBatches.length ? (
        <EmptyState
          title={`No ${tab} batches`}
          description={
            tab === "upcoming"  ? "Batches with no learners yet appear here." :
            tab === "completed" ? "Archived batches appear here." :
                                  "Active batches assigned to you will appear here."
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displayBatches.map((batch) => {
            const pct          = batch.syllabusProgress ?? 0;
            const pColor       = progressBarColor(pct);
            const learnerCount = batch.learners?.length || 0;
            const totalPages   = batch.course?.pages?.length || 0;

            return (
              <div
                key={batch._id}
                className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card hover:shadow-md transition-shadow"
              >
                {/* Batch thumbnail */}
                {batch.thumbnail && (
                  <div className="h-32 w-full overflow-hidden bg-slate-100">
                    <img
                      src={batch.thumbnail}
                      alt={batch.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.parentElement.style.display = "none"; }}
                    />
                  </div>
                )}
                <div className="p-5">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-brand-primary truncate">{batch.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {batch.course?.title || "No course assigned"}
                    </p>
                    {totalPages > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{totalPages} pages in syllabus</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${GROUP_BADGE[batch.performanceGroup] || "bg-slate-100 text-slate-600"}`}>
                    {batch.performanceGroup}
                  </span>
                </div>

                {/* Learner count */}
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-brand-surface px-3 py-2 text-sm font-semibold text-brand-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5L2 10z" />
                    </svg>
                    {learnerCount} Student{learnerCount !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Syllabus Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Syllabus Progress</span>
                    <span className="font-bold" style={{ color: pColor }}>{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: pColor }}
                    />
                  </div>
                  {/* Coverage label */}
                  <p className="mt-1 text-[10px] text-slate-400">
                    {pct === 0 ? "Not started yet" :
                     pct === 100 ? "Fully covered ✓" :
                     pct >= 75 ? "Final stretch" :
                     pct >= 50 ? "Midway through" :
                     "In progress"}
                    {totalPages > 0 && pct > 0 && ` · ~${Math.round((pct / 100) * totalPages)}/${totalPages} pages`}
                  </p>
                </div>

                {/* Learner avatars */}
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

                {/* Update progress button */}
                <button
                  onClick={() => setEditing(batch)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:border-brand-primary hover:text-brand-primary transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Update Progress
                </button>
                </div>{/* end p-5 */}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorBatchesPage;
