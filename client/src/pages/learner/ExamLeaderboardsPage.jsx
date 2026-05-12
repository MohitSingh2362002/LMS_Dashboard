import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const StatTile = ({ label, value, sub, dark }) => (
  <div className={`w-40 shrink-0 rounded-2xl p-3 shadow-card sm:w-auto sm:p-4 ${dark ? "bg-brand-ink text-white" : "border border-slate-200/70 bg-white"}`}>
    <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-white/60" : "text-slate-500"}`}>{label}</p>
    <p className={`mt-1 text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-brand-ink"}`}>{value}</p>
    {sub ? <p className={`mt-0.5 text-[11px] ${dark ? "text-brand-cta" : "text-emerald-600"}`}>{sub}</p> : null}
  </div>
);

const Podium = ({ rank, name, sub, score, accuracy, color, badge, totalAttempts }) => {
  const sizes = {
    1: { ring: "h-32 w-32", scale: "scale-110", base: "bg-gradient-to-br from-brand-accent to-brand-primary" },
    2: { ring: "h-24 w-24", scale: "scale-95", base: "bg-gradient-to-br from-slate-200 to-slate-300" },
    3: { ring: "h-24 w-24", scale: "scale-95", base: "bg-gradient-to-br from-amber-200 to-amber-400" }
  };
  const s = sizes[rank];
  return (
    <div className={`relative w-56 shrink-0 rounded-2xl border border-slate-200/70 bg-white p-4 text-center shadow-card transition-transform sm:w-auto sm:p-5 ${s.scale}`}>
      <div className="mb-2">
        <span
          className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            rank === 1 ? "bg-brand-primary text-white" : rank === 2 ? "bg-slate-300 text-slate-800" : "bg-amber-300 text-amber-900"
          }`}
        >
          {badge}
        </span>
      </div>
      <div className="relative mx-auto flex items-center justify-center">
        <div className={`${rank === 1 ? "h-24 w-24 sm:h-32 sm:w-32" : "h-20 w-20 sm:h-24 sm:w-24"} flex items-center justify-center rounded-full ${s.base} text-white`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-10 w-10">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a8 8 0 0116 0v1" />
          </svg>
        </div>
        {rank === 1 ? (
          <span className="absolute -bottom-1 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-4 w-4"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4l-10 10-3-3" /></svg>
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-base font-bold text-brand-ink">{name}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
      {rank === 1 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
          <div><p className="text-[9px] font-semibold uppercase text-slate-400">Tests Taken</p><p className="font-bold text-brand-ink">{totalAttempts ?? "—"}</p></div>
          <div><p className="text-[9px] font-semibold uppercase text-slate-400">Global Rank</p><p className="font-bold text-brand-ink">#1</p></div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
          <div><p className="text-[9px] font-semibold uppercase text-slate-400">Score</p><p className="font-bold text-brand-ink">{score}</p></div>
          <div><p className="text-[9px] font-semibold uppercase text-slate-400">Accuracy</p><p className="font-bold text-brand-ink">{accuracy}</p></div>
        </div>
      )}
    </div>
  );
};

const TrendIcon = ({ tone }) => {
  if (tone === "up") return <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" className="inline h-4 w-4"><path d="M3 17l6-6 4 4 8-8M21 7v6h-6" /></svg>;
  if (tone === "down") return <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" className="inline h-4 w-4"><path d="M3 7l6 6 4-4 8 8M21 17v-6h-6" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" className="inline h-4 w-4"><path d="M5 12h14" /></svg>;
};

const BADGE_LABELS = ["TOP PERFORMER", "2ND PLACE", "3RD PLACE"];

const DAY_OPTIONS = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 90 Days", value: 90 },
  { label: "All Time", value: 0 },
];

const ExamLeaderboardsPage = ({ basePath = "/learner/exam" }) => {
  const [batchFilter, setBatchFilter] = useState("");
  const [patternFilter, setPatternFilter] = useState("");
  const [dayFilter, setDayFilter] = useState(30);

  const { data: tests, loading: loadingTests } = useFetch(() => api.get("/exam/tests"), []);
  const { data: lbData, loading: loadingLb } = useFetch(
    () => api.get(`/analytics/leaderboard?limit=50${dayFilter ? `&days=${dayFilter}` : ""}`),
    [dayFilter]
  );

  const leaderboard = useMemo(() => {
    const raw = lbData && Array.isArray(lbData.leaderboard) ? lbData.leaderboard : [];
    return raw.filter((l) => !batchFilter || l.batchName === batchFilter);
  }, [lbData, batchFilter]);

  // Unique batch names from leaderboard data
  const batchOptions = useMemo(() => {
    const raw = lbData && Array.isArray(lbData.leaderboard) ? lbData.leaderboard : [];
    return [...new Set(raw.map((l) => l.batchName).filter(Boolean))].sort();
  }, [lbData]);

  // Unique exam patterns from tests for the subject/pattern filter
  const patternOptions = useMemo(() => {
    const arr = Array.isArray(tests) ? tests : [];
    return [...new Set(arr.map((t) => t.examPattern).filter(Boolean))].sort();
  }, [tests]);

  const podium = useMemo(() =>
    leaderboard.slice(0, 3).map((l, i) => ({
      rank: i + 1,
      name: l.name,
      sub: l.batchName ? `Batch ${l.batchName}` : "—",
      score: `${l.totalPoints} pts`,
      accuracy: `${l.accuracy}%`,
      badge: BADGE_LABELS[i],
      totalAttempts: l.totalAttempts,
    })), [leaderboard]);

  const tableRows = useMemo(() =>
    leaderboard.slice(3).map((l, i) => ({
      rank: `#${String(i + 4).padStart(2, "0")}`,
      name: l.name,
      email: l.email,
      batch: l.batchName || "—",
      tests: l.totalAttempts,
      avgScore: `${l.avgScore}%`,
      trend: l.avgScore >= 80 ? "up" : l.avgScore >= 60 ? "neutral" : "down",
    })), [leaderboard]);

  const mobileRows = useMemo(() => leaderboard.map((l, i) => ({
    rank: i + 1,
    name: l.name,
    email: l.email,
    batch: l.batchName || "—",
    tests: l.totalAttempts,
    avgScore: `${l.avgScore}%`,
    accuracy: `${l.accuracy}%`,
    trend: l.avgScore >= 80 ? "up" : l.avgScore >= 60 ? "neutral" : "down",
  })), [leaderboard]);

  // Filtered tests for per-test links (by exam pattern)
  const filteredTests = useMemo(() => {
    const arr = Array.isArray(tests) ? tests : [];
    return patternFilter ? arr.filter((t) => t.examPattern === patternFilter) : arr;
  }, [tests, patternFilter]);

  const loading = loadingTests || loadingLb;
  if (loading) return <Loader label="Loading leaderboards..." />;

  const totalParticipants = lbData?.totalParticipants || leaderboard.length;
  const overallAvg = lbData?.overallAvg || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Student Performance Leaderboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time engagement metrics and academic rankings across all batches.</p>
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <option value="">All Batches</option>
            {batchOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={patternFilter}
            onChange={(e) => setPatternFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <option value="">All Exam Types</option>
            {patternOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(Number(e.target.value))}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          {(batchFilter || patternFilter || dayFilter !== 30) ? (
            <button
              onClick={() => { setBatchFilter(""); setPatternFilter(""); setDayFilter(30); }}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:px-0 md:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Participants" value={totalParticipants.toLocaleString()} sub="Learners with test attempts" />
        <StatTile label="Overall Avg Score" value={overallAvg ? `${overallAvg}%` : "—"} sub={leaderboard.length > 0 ? "Based on all attempts" : "No attempts yet"} />
        <StatTile label="Top Scorer" value={leaderboard[0]?.name?.split(" ")[0] || "—"} sub={leaderboard[0] ? `${leaderboard[0].avgScore}% avg · ${leaderboard[0].totalAttempts} tests` : "No data yet"} />
        <StatTile label="Leaderboard Size" value={leaderboard.length} sub={filteredTests.length ? `Across ${filteredTests.length} test${filteredTests.length > 1 ? "s" : ""}` : "No tests published"} dark />
      </div>

      {/* Podium */}
      {podium.length > 0 ? (
        <div className="-mx-3 flex items-stretch gap-4 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:items-end sm:px-0 md:grid-cols-3">
          {podium[1] ? <div className="md:order-1"><Podium {...podium[1]} /></div> : <div className="md:order-1" />}
          <div className="md:order-2"><Podium {...podium[0]} /></div>
          {podium[2] ? <div className="md:order-3"><Podium {...podium[2]} /></div> : <div className="md:order-3" />}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
          No test attempts yet. Leaderboard will appear once students complete tests.
        </div>
      )}

      {/* Extended Rankings */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-brand-ink">Extended Rankings</h2>
          <span className="text-xs font-semibold text-slate-500">
            TOP {leaderboard.length} STUDENTS (by avg score)
          </span>
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Rank</th>
                <th className="px-5 py-3 text-left">Student</th>
                <th className="px-5 py-3 text-left">Batch Info</th>
                <th className="px-5 py-3 text-left">Tests Taken</th>
                <th className="px-5 py-3 text-left">Avg Score</th>
                <th className="px-5 py-3 text-left">Trend</th>
                <th className="px-5 py-3 text-left">Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((r) => (
                <tr key={r.rank} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-bold text-brand-ink">{r.rank}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface text-xs font-bold text-brand-primary">
                        {r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-ink">{r.name}</p>
                        <p className="text-[11px] text-slate-500">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Batch {r.batch}</span></td>
                  <td className="px-5 py-3 text-slate-600">{r.tests}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: r.avgScore }} />
                      </div>
                      <span className="text-xs font-semibold">{r.avgScore}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><TrendIcon tone={r.trend} /></td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 text-base">⚡ ⭐</div>
                  </td>
                </tr>
              ))}
              {!tableRows.length ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">No rankings yet</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-slate-100 sm:hidden">
          {mobileRows.map((r) => (
            <div key={`${r.email}-${r.rank}`} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${r.rank <= 3 ? "bg-brand-primary text-white" : "bg-brand-surface text-brand-primary"}`}>
                  #{r.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-brand-ink">{r.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{r.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-emerald-600">{r.avgScore}</p>
                  <p className="text-[10px] text-slate-400">avg</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <p className="font-bold text-brand-ink">{r.tests}</p>
                  <p className="text-slate-400">Tests</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <p className="font-bold text-brand-ink">{r.accuracy}</p>
                  <p className="text-slate-400">Accuracy</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <p className="truncate font-bold text-brand-ink">{r.batch}</p>
                  <p className="text-slate-400">Batch</p>
                </div>
              </div>
            </div>
          ))}
          {!mobileRows.length ? <p className="px-5 py-8 text-center text-sm text-slate-500">No rankings yet</p> : null}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>Showing {tableRows.length} entries (ranks #4–#{3 + tableRows.length})</span>
        </div>
      </div>

      {/* Per-test leaderboard links */}
      {Array.isArray(tests) && tests.length ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-brand-ink">Per-Test Leaderboards</h3>
            {patternFilter ? (
              <span className="rounded-md bg-brand-surface px-2 py-0.5 text-[10px] font-bold uppercase text-brand-primary">{patternFilter}</span>
            ) : null}
          </div>
          {filteredTests.length ? (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredTests.slice(0, 9).map((t) => (
                <Link key={t._id} to={`${basePath}/tests/${t._id}/leaderboard`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50">
                  <div className="min-w-0">
                    <span className="font-medium text-brand-ink">{t.title}</span>
                    {t.examPattern ? <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{t.examPattern}</span> : null}
                  </div>
                  <span className="text-brand-primary shrink-0 ml-2">View →</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">No tests match the selected filter.</p>
          )}
        </div>
      ) : !leaderboard.length ? (
        <EmptyState title="No leaderboard data" description="Published tests will populate the leaderboard once students attempt them." />
      ) : null}
    </div>
  );
};

export default ExamLeaderboardsPage;
