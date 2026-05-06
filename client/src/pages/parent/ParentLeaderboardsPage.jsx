import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IcTrophy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const IcClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IcQ = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" />
  </svg>
);

/* ── Leaderboard panel ──────────────────────────────────────────────────── */
const LeaderboardPanel = ({ test, linkedLearnerIds }) => {
  const { data, loading } = useFetch(
    () => api.get(`/exam/tests/${test._id}/leaderboard`),
    [test._id]
  );

  // API returns a flat array (each entry has rank injected server-side)
  const entries = Array.isArray(data) ? data : (data?.leaderboard || []);
  const myEntries = entries.filter((e) =>
    linkedLearnerIds.has(String(e.learner?._id || e.learnerId))
  );

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  );

  const medalColor = (rank) => {
    if (rank === 1) return { bg: "#FEF3C7", text: "#D97706", medal: "🥇" };
    if (rank === 2) return { bg: "#F1F5F9", text: "#64748B", medal: "🥈" };
    if (rank === 3) return { bg: "#FEF9EC", text: "#B45309", medal: "🥉" };
    return { bg: "transparent", text: "#1C1E2B", medal: null };
  };

  return (
    <div className="mt-4">
      {!entries.length ? (
        <p className="py-6 text-center text-sm text-slate-400">No attempts yet for this test.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100">
          {/* Header */}
          <div className="grid grid-cols-[2rem_1fr_5rem_5rem] gap-2 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div>#</div>
            <div>Learner</div>
            <div className="text-right">Score</div>
            <div className="text-right">Time</div>
          </div>
          {entries.slice(0, 10).map((entry, i) => {
            const rank    = entry.rank || (i + 1);
            const pct     = entry.maxScore ? Math.round((entry.score / entry.maxScore) * 100) : 0;
            const isLinked = linkedLearnerIds.has(String(entry.learner?._id || entry.learnerId));
            const { bg, text, medal } = medalColor(rank);
            const mins = entry.timeTakenSeconds ? Math.ceil(entry.timeTakenSeconds / 60) : null;
            const name = entry.learner?.name || entry.name || `Learner ${rank}`;
            const initials = name.split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");

            return (
              <div
                key={entry._id || i}
                className={`grid grid-cols-[2rem_1fr_5rem_5rem] items-center gap-2 border-t border-slate-100 px-4 py-3 ${
                  isLinked ? "bg-teal-50/50" : ""
                }`}
                style={{ backgroundColor: isLinked ? "#F0FDFB" : bg !== "transparent" ? bg : undefined }}
              >
                {/* Rank */}
                <div className="text-sm font-extrabold" style={{ color: text }}>
                  {medal || `#${rank}`}
                </div>
                {/* Learner */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                    ${isLinked ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xs font-semibold ${isLinked ? "text-teal-700" : "text-brand-ink"}`}>
                      {name} {isLinked && "★"}
                    </p>
                    {isLinked && <p className="text-[9px] text-teal-500">Your child</p>}
                  </div>
                </div>
                {/* Score */}
                <div className="text-right">
                  <p className="text-xs font-extrabold" style={{ color: pct >= 70 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444" }}>
                    {pct}%
                  </p>
                  <p className="text-[10px] text-slate-400">{entry.score}/{entry.maxScore}</p>
                </div>
                {/* Time */}
                <div className="text-right text-[11px] text-slate-500">
                  {mins ? `${mins}m` : "—"}
                </div>
              </div>
            );
          })}
          {entries.length > 10 && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-[11px] text-slate-400">
              {entries.length - 10} more entries
            </div>
          )}
        </div>
      )}

      {/* My child's rank highlight */}
      {myEntries.length > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
          <span className="text-lg">⭐</span>
          <div>
            {myEntries.map((e) => (
              <p key={e._id} className="text-xs font-bold text-teal-700">
                {e.learner?.name} ranked <span className="text-base">#{e.rank}</span> with {e.maxScore ? Math.round((e.score / e.maxScore) * 100) : 0}%
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Test Item ──────────────────────────────────────────────────────────── */
const TestLeaderboardItem = ({ test, linkedLearnerIds }) => {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
      {/* Header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition"
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <IcTrophy />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-extrabold text-brand-ink">{test.title}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {test.examPattern && (
              <span className="text-[10px] font-bold text-brand-primary">{test.examPattern}</span>
            )}
            {test.batch?.name && (
              <span className="text-[10px] text-slate-400">· {test.batch.name}</span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <IcQ />{test.questions?.length ?? 0} Qs
            </span>
            {test.durationMinutes && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <IcClock />{test.durationMinutes}m
              </span>
            )}
          </div>
        </div>
        {/* Chevron */}
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded leaderboard */}
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <LeaderboardPanel test={test} linkedLearnerIds={linkedLearnerIds} />
        </div>
      )}
    </article>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────────── */
const ParentLeaderboardsPage = () => {
  const { data, loading } = useFetch(() => api.get("/exam/parent/summary"), []);
  const tests          = data?.tests    || [];
  const attempts       = data?.attempts || [];

  // Linked learner IDs from attempts
  const linkedLearnerIds = new Set(
    attempts.map((a) => String(a.learner?._id)).filter(Boolean)
  );

  if (loading) return <Loader label="Loading leaderboards…" />;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Leaderboards</h1>
          <p className="mt-1 text-sm text-slate-500">
            Rank your child against other learners. Stars ★ mark linked learners.
          </p>
        </div>
        <Link
          to="/parent/exam"
          className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition"
        >
          ← Tests Overview
        </Link>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-teal-200/60 bg-teal-50/60 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-teal-700">
          <span className="h-3 w-3 rounded-full bg-teal-100 border border-teal-300" />
          <span className="font-semibold">Highlighted rows</span> = your child
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span>🥇🥈🥉</span> Top 3 performers
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span>★</span> Your child
        </div>
      </div>

      {!tests.length ? (
        <EmptyState
          title="No leaderboards yet"
          description="Published tests for linked learners will appear here."
        />
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <TestLeaderboardItem
              key={test._id}
              test={test}
              linkedLearnerIds={linkedLearnerIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentLeaderboardsPage;
