import { useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

/* ── Tiny SVG icons ────────────────────────────────────────────────────── */
const IcUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);
const IcChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IcBatch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

/* ── Progress Ring ─────────────────────────────────────────────────────── */
const ProgressRing = ({ pct, size = 56, stroke = 5, color = "#0D9488" }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

/* ── Stat Card ─────────────────────────────────────────────────────────── */
const StatTile = ({ label, value, icon: Icon, bg, text, helper }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
      <Icon />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-brand-ink">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {helper && <p className="text-[10px] text-slate-400">{helper}</p>}
    </div>
  </div>
);

/* ── Learner Card ──────────────────────────────────────────────────────── */
const LearnerCard = ({ learner, enrollments, batches }) => {
  const mine = enrollments.filter((e) => String(e.learner?._id) === String(learner._id));
  const myBatches = batches.filter((b) =>
    b.learners?.some((l) => String(l._id) === String(learner._id))
  );
  const avgPct = mine.length
    ? Math.round(mine.reduce((s, e) => s + (e.progress || 0), 0) / mine.length)
    : 0;
  const completed = mine.filter((e) => (e.progress || 0) >= 100).length;

  const initials = (learner.name || "?").split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");
  const colors = ["#0D9488", "#1A4FA0", "#7C3AED", "#D97706", "#DC2626"];
  const color  = colors[learner.name?.charCodeAt(0) % colors.length] || "#0D9488";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:shadow-cardHover">
      {/* Header strip */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
            style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-extrabold text-brand-ink">{learner.name}</h3>
            <p className="truncate text-[11px] text-slate-500">{learner.email}</p>
          </div>
          {/* Ring */}
          <div className="relative shrink-0">
            <ProgressRing pct={avgPct} color={color} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-extrabold text-brand-ink">{avgPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50 text-center">
        {[
          { label: "Courses", val: mine.length },
          { label: "Done", val: completed },
          { label: "Batches", val: myBatches.length },
        ].map(({ label, val }) => (
          <div key={label} className="py-3">
            <p className="text-base font-extrabold text-brand-ink">{val}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Courses */}
      {mine.length > 0 && (
        <div className="p-4 space-y-2.5">
          {mine.slice(0, 2).map((e) => (
            <div key={e._id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold text-slate-700 truncate max-w-[70%]">{e.course?.title || "Course"}</p>
                <span className="text-[10px] font-bold" style={{ color }}>{e.progress || 0}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${e.progress || 0}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
          {mine.length > 2 && (
            <p className="text-[10px] text-slate-400">+{mine.length - 2} more course{mine.length - 2 !== 1 ? "s" : ""}</p>
          )}
        </div>
      )}

      {/* Batch tags */}
      {myBatches.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-1.5">
          {myBatches.slice(0, 2).map((b) => (
            <span key={b._id} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 capitalize">{b.performanceGroup || b.name}</span>
          ))}
        </div>
      )}
    </article>
  );
};

/* ── Quick Link Tile ───────────────────────────────────────────────────── */
const QuickTile = ({ to, icon: Icon, label, sub, gradient }) => (
  <Link
    to={to}
    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-white transition hover:-translate-y-0.5 hover:shadow-lg ${gradient}`}
  >
    {/* Decorative orbs */}
    <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/15" />
    <div className="pointer-events-none absolute -right-2 -bottom-10 h-16 w-16 rounded-full bg-white/15" />
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
      <Icon />
    </div>
    <div className="relative mt-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label.toUpperCase()}</p>
      <p className="mt-0.5 text-base font-extrabold">{sub}</p>
    </div>
    <div className="relative mt-4 flex justify-end opacity-60 group-hover:opacity-100 transition">
      <IcArrow />
    </div>
  </Link>
);

/* ── Main Page ─────────────────────────────────────────────────────────── */
const ParentDashboardPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/dashboard"), []);

  const enrollments    = data?.enrollments    || [];
  const learners       = data?.linkedLearners || [];
  const batches        = data?.batches        || [];

  const avgProgress = useMemo(() => (
    enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
      : 0
  ), [enrollments]);

  const completedCount = enrollments.filter((e) => (e.progress || 0) >= 100).length;

  if (loading) return <Loader variant="skeleton" label="Loading parent dashboard…" />;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 text-white"
        style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 40%, #134E4A 100%)" }}
      >
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-200">Parent Dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-snug">
            {learners.length > 0
              ? `Tracking ${learners.length} learner${learners.length !== 1 ? "s" : ""}`
              : "Welcome, Parent"}
          </h1>
          <p className="mt-1.5 text-sm text-white/75">
            Course progress, batch details & test results — all in one view.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/parent/reports" className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 transition">
              Growth Reports
            </Link>
            <Link to="/parent/exam" className="rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition">
              View Tests
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat Tiles ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Linked Learners"  value={learners.length}    icon={IcUsers} bg="bg-teal-50"    text="text-teal-700"   helper="Connected children" />
        <StatTile label="Active Courses"   value={enrollments.length} icon={IcBook}  bg="bg-brand-surface" text="text-brand-primary" helper="Total enrollments" />
        <StatTile label="Courses Completed" value={completedCount}    icon={IcCheck} bg="bg-emerald-50" text="text-emerald-700" helper="Finished at 100%" />
        <StatTile label="Avg Progress"      value={`${avgProgress}%`} icon={IcChart} bg="bg-amber-50"   text="text-amber-700"  helper="Across all courses" />
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <QuickTile to="/parent/reports"           icon={IcChart}  label="Growth Reports" sub="Score trends & ranks" gradient="bg-gradient-to-br from-[#10B981] to-[#059669]" />
        <QuickTile to="/parent/batches"           icon={IcBatch}  label="My Batches"     sub="Batch & mentor info"  gradient="bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]" />
        <QuickTile to="/parent/exam"              icon={IcBook}   label="Tests"          sub="Mock test status"     gradient="bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]" />
        <QuickTile to="/parent/exam/leaderboards" icon={IcUsers}  label="Leaderboards"   sub="Rank comparison"      gradient="bg-gradient-to-br from-[#F97316] to-[#C2410C]" />
      </div>

      {/* ── Learner Cards ── */}
      {!learners.length ? (
        <EmptyState
          title="No learner linked"
          description="Ask the admin to link this parent account with a learner account."
        />
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-brand-ink">Linked Learners</h2>
            <span className="rounded-full bg-teal-50 px-3 py-0.5 text-xs font-bold text-teal-700">
              {learners.length} learner{learners.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {learners.map((learner) => (
              <LearnerCard
                key={learner._id}
                learner={learner}
                enrollments={enrollments}
                batches={batches}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── All Enrollments Table (if many) ── */}
      {enrollments.length > 0 && (
        <section className="rounded-2xl border border-slate-200/70 bg-white shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-brand-ink">Course Enrollments</h2>
            <span className="text-[11px] text-slate-500">{enrollments.length} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {enrollments.slice(0, 6).map((e) => {
              const pct = e.progress || 0;
              const pColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#0D9488" : "#F59E0B";
              return (
                <div key={e._id} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Learner avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-teal-700">
                    {(e.learner?.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-brand-ink">{e.learner?.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{e.course?.title || "Course"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pColor }} />
                    </div>
                    <span className="w-9 text-right text-[11px] font-bold" style={{ color: pColor }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          {enrollments.length > 6 && (
            <div className="px-5 py-3 border-t border-slate-100 text-center">
              <Link to="/parent/reports" className="text-xs font-bold text-teal-700 hover:underline">
                View all {enrollments.length} enrollments in Reports →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ParentDashboardPage;
