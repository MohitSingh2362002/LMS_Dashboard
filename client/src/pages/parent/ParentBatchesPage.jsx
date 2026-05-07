import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IcUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IcBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);
const IcCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Performance group config ──────────────────────────────────────────── */
const GROUP_STYLE = {
  foundation: { bg: "bg-slate-100",   text: "text-slate-600",   dot: "#64748B" },
  growth:     { bg: "bg-amber-100",   text: "text-amber-700",   dot: "#D97706" },
  merit:      { bg: "bg-emerald-100", text: "text-emerald-700", dot: "#059669" },
  ranker:     { bg: "bg-brand-surface", text: "text-brand-primary", dot: "#1A4FA0" },
};

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ── Batch Card ─────────────────────────────────────────────────────────── */
const BatchCard = ({ batch, linkedLearners = [] }) => {
  const grp   = (batch.performanceGroup || "foundation").toLowerCase();
  const style = GROUP_STYLE[grp] || GROUP_STYLE.foundation;

  // Filter to only linked learners in this batch
  const myLearners = batch.learners?.filter((l) =>
    linkedLearners.some((ll) => String(ll._id) === String(l._id))
  ) || [];

  const syllabusProgress = batch.syllabusProgress ?? 0;
  const progressColor = syllabusProgress >= 80 ? "#10B981" : syllabusProgress >= 50 ? "#0D9488" : "#F59E0B";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:shadow-cardHover hover:-translate-y-0.5">
      {/* Thumbnail — h-44 to match course card */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-teal-500 to-teal-700">
        {batch.thumbnail ? (
          <img
            src={batch.thumbnail}
            alt={batch.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-12 w-12 opacity-40">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
        )}
        {/* Track badge */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text}`}>
          {batch.performanceGroup || "—"}
        </span>
      </div>
      {/* Header band */}
      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-extrabold text-brand-ink">{batch.name}</h3>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{batch.course?.title || "No course linked"}</p>
          </div>
        </div>
      </div>

      {/* Syllabus progress */}
      <div className="mt-4 px-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] text-slate-500 font-medium">Syllabus Progress</p>
          <p className="text-[11px] font-bold" style={{ color: progressColor }}>{syllabusProgress}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${syllabusProgress}%`, backgroundColor: progressColor }}
          />
        </div>
      </div>

      {/* Info rows */}
      <div className="mt-4 px-5 space-y-2.5">
        {/* Mentor */}
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <IcUser />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium">Mentor</p>
            <p className="text-xs font-bold text-brand-ink truncate">{batch.mentor?.name || "Unassigned"}</p>
            {batch.mentor?.email && (
              <p className="text-[10px] text-slate-400 truncate">{batch.mentor.email}</p>
            )}
          </div>
        </div>

        {/* Course */}
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-brand-primary">
            <IcBook />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium">Course</p>
            <p className="text-xs font-bold text-brand-ink truncate">{batch.course?.title || "—"}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <IcCalendar />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Started</p>
                <p className="text-xs font-bold text-brand-ink">{fmtDate(batch.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-medium">Updated</p>
                <p className="text-xs font-bold text-brand-ink">{fmtDate(batch.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My linked learners in this batch */}
      {myLearners.length > 0 && (
        <div className="mt-4 px-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Your child in this batch</p>
          <div className="flex flex-wrap gap-1.5">
            {myLearners.map((l) => (
              <div
                key={l._id}
                className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700"
              >
                <div className="h-4 w-4 rounded-full bg-teal-200 flex items-center justify-center text-[8px] font-black text-teal-800">
                  {(l.name || "?")[0].toUpperCase()}
                </div>
                {l.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All learner avatars */}
      {batch.learners?.length > 0 && (
        <div className="mt-3 px-5 pb-5">
          <div className="flex items-center gap-2">
            <div className="flex">
              {batch.learners.slice(0, 5).map((l, i) => (
                <div
                  key={l._id || i}
                  title={l.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-surface text-[9px] font-bold text-brand-primary"
                  style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 5 - i }}
                >
                  {(l.name || "?").slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">
              {batch.learners.length} student{batch.learners.length !== 1 ? "s" : ""} in batch
            </span>
          </div>
        </div>
      )}
    </article>
  );
};

/* ── Main Page ─────────────────────────────────────────────────────────── */
const ParentBatchesPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/dashboard"), []);
  const batches       = data?.batches        || [];
  const linkedLearners = data?.linkedLearners || [];

  if (loading) return <Loader label="Loading batch details…" />;

  // Batch stats
  const groups = batches.reduce((acc, b) => {
    const g = b.performanceGroup || "other";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">My Batches</h1>
          <p className="mt-1 text-sm text-slate-500">
            Batch placement, mentor info, and syllabus progress for linked learners.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2">
          <span className="text-lg">🏫</span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500">Total Batches</p>
            <p className="text-sm font-extrabold text-teal-700">{batches.length}</p>
          </div>
        </div>
      </div>

      {/* ── Group summary chips ── */}
      {batches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(groups).map(([g, count]) => {
            const style = GROUP_STYLE[g.toLowerCase()] || GROUP_STYLE.foundation;
            return (
              <div key={g} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${style.bg} ${style.text}`}>
                <IcStar />
                <span className="capitalize">{g}</span>
                <span className="rounded-full bg-white/60 px-1.5">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Grid ── */}
      {!batches.length ? (
        <EmptyState
          title="No batches assigned"
          description="Your child's batch will appear here once the admin assigns them to one."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <BatchCard key={batch._id} batch={batch} linkedLearners={linkedLearners} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentBatchesPage;
