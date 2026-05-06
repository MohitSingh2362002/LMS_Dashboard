import { useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IcTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IcWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IcBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);

/* placeholder — Sparkline removed, using TrendChart only */

/* ── Subject bar row ───────────────────────────────────────────────────── */
const SubjectRow = ({ name, correct, total, accuracy }) => {
  const color = accuracy >= 70 ? "#10B981" : accuracy >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-[11px] font-semibold text-slate-700 truncate">{name}</div>
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${accuracy}%`, backgroundColor: color }} />
      </div>
      <div className="w-12 shrink-0 text-right text-[11px] font-bold" style={{ color }}>{accuracy}%</div>
      <div className="w-16 shrink-0 text-right text-[10px] text-slate-400">{correct}/{total} correct</div>
    </div>
  );
};

/* ── Score trend bar chart ─────────────────────────────────────────────── */
const TrendChart = ({ trend, color = "#0D9488" }) => {
  if (!trend || trend.length === 0) return (
    <div className="flex h-32 items-center justify-center text-sm text-slate-400">No attempts yet</div>
  );

  const vals = trend.map((t) => t.percentage || 0);

  const barColor = (v) =>
    v >= 70 ? "#10B981" : v >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="w-full">
      {/* Y-axis grid + bars */}
      <div className="relative" style={{ height: 140 }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <div
            key={v}
            className="absolute left-0 right-0 flex items-center gap-2"
            style={{ bottom: `${v}%`, top: "auto" }}
          >
            <span className="w-7 shrink-0 text-right text-[9px] text-slate-400">{v}%</span>
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-1.5 pl-9 pr-1 pb-0">
          {vals.map((v, i) => {
            const a = trend[i];
            const bc = barColor(v);
            return (
              <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
                {/* Score label above bar */}
                <span
                  className="mb-1 text-[10px] font-bold"
                  style={{ color: bc }}
                >
                  {v}%
                </span>
                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(v, 2)}%`,
                    backgroundColor: bc,
                    opacity: 0.85,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-1.5 pl-9 pr-1">
        {trend.map((a, i) => {
          const label = a?.testTitle ? a.testTitle.slice(0, 9) : `T${i + 1}`;
          return (
            <div key={i} className="flex-1 text-center">
              <span className="block truncate text-[9px] text-slate-400">{label}</span>
              {a?.rank && (
                <span className="block text-[8px] font-bold text-slate-300">#{a.rank}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Learner Report Panel ──────────────────────────────────────────────── */
const LearnerReportPanel = ({ report }) => {
  const [tab, setTab] = useState("overview");
  const { learner, summary, courseProgress, trend, subjectStats, weakTopics } = report;

  const initials = (learner.name || "?").split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");
  const colors = ["#0D9488", "#1A4FA0", "#7C3AED", "#D97706", "#DC2626"];
  const color  = colors[learner.name?.charCodeAt(0) % colors.length] || "#0D9488";

  const tabs = ["overview", "tests", "subjects", "weak areas"];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}
        >
          {initials}
        </div>
        <div>
          <h2 className="text-base font-extrabold text-brand-ink">{learner.name}</h2>
          <p className="text-[11px] text-slate-500">{learner.email}</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5 md:grid-cols-4">
        {[
          { label: "Avg Course", val: `${summary.averageProgress}%`, color: "#0D9488", icon: <IcBook /> },
          { label: "Avg Test",   val: `${summary.averageTestScore}%`, color: "#1A4FA0", icon: <IcTrend /> },
          { label: "Attempts",   val: summary.attempts, color: "#7C3AED", icon: <IcTarget /> },
          { label: "Weak Areas", val: weakTopics.length, color: "#F59E0B", icon: <IcWarn /> },
        ].map(({ label, val, color: c, icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${c}18`, color: c }}>
              {icon}
            </div>
            <div>
              <p className="text-lg font-extrabold text-brand-ink">{val}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-100 px-5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 pb-3 pt-3 mr-5 text-[11px] font-bold capitalize transition ${
              tab === t ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-brand-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Course Progress</p>
            {courseProgress.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No courses enrolled yet.</p>
            ) : (
              <div className="space-y-3">
                {courseProgress.map((c) => {
                  const pct = c.progress || 0;
                  const pc  = pct >= 80 ? "#10B981" : pct >= 50 ? "#0D9488" : "#F59E0B";
                  return (
                    <div key={c.enrollmentId}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-brand-ink truncate max-w-[70%]">{c.courseTitle}</p>
                        <span className="text-[11px] font-bold" style={{ color: pc }}>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pc }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tests ── */}
        {tab === "tests" && (
          <div className="space-y-4">
            {trend.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No test attempts yet.</p>
            ) : (
              <>
                {/* Chart */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Score Trend</p>
                  <TrendChart trend={trend.slice(-10)} color={color} />
                </div>

                {/* Attempt list */}
                <div className="space-y-2">
                  {trend.slice().reverse().map((a) => (
                    <div key={a.attemptId} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 hover:bg-slate-100 transition">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-brand-ink truncate">{a.testTitle}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(a.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold" style={{ color: a.percentage >= 70 ? "#10B981" : a.percentage >= 50 ? "#F59E0B" : "#EF4444" }}>
                          {a.percentage}%
                        </p>
                        {a.rank && <p className="text-[10px] text-slate-400">Rank #{a.rank}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Subjects ── */}
        {tab === "subjects" && (
          <div className="space-y-3">
            {subjectStats.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No subject data yet.</p>
            ) : (
              subjectStats.slice(0, 8).map((s) => (
                <SubjectRow key={s.name} {...s} />
              ))
            )}
          </div>
        )}

        {/* ── Weak Areas ── */}
        {tab === "weak areas" && (
          <div className="space-y-3">
            {weakTopics.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-sm font-bold text-emerald-700">No weak areas detected!</p>
                  <p className="text-xs text-emerald-600">All attempted topics are above 60% accuracy.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-500">Topics below 60% accuracy that need extra attention:</p>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
                    >
                      <IcWarn />
                      <span className="text-[11px] font-bold text-amber-800">{t.name}</span>
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{t.accuracy}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

/* ── Main Page ─────────────────────────────────────────────────────────── */
const ParentReportsPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/reports"), []);
  const reports = data?.reports || [];

  if (loading) return <Loader variant="skeleton" label="Loading growth reports…" />;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Growth Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Academic progress, test scores, subject accuracy & weak areas for linked learners.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2">
          <span className="text-lg">📊</span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500">Total Learners</p>
            <p className="text-sm font-extrabold text-teal-700">{reports.length}</p>
          </div>
        </div>
      </div>

      {!reports.length ? (
        <EmptyState
          title="No learner reports yet"
          description="Reports appear once learners are linked and start their courses or tests."
        />
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <LearnerReportPanel key={report.learner._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentReportsPage;
