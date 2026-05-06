import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

/* ── Icons ─────────────────────────────────────────────────────────────── */
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
const IcSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IcLeaderboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

/* ── Score donut ────────────────────────────────────────────────────────── */
const ScoreRing = ({ pct, size = 44, color }) => {
  const c = color || (pct >= 70 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444");
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-extrabold" style={{ color: c }}>{pct}%</span>
      </div>
    </div>
  );
};

/* ── Test Card ──────────────────────────────────────────────────────────── */
const TestCard = ({ test, myAttempts, linkedLearners }) => {
  const totalAttempts = myAttempts.length;
  const pending       = linkedLearners.filter(
    (ll) => !myAttempts.some((a) => String(a.learner?._id) === String(ll._id))
  );
  const allAttempted  = pending.length === 0 && linkedLearners.length > 0;

  const avgPct = totalAttempts
    ? Math.round(myAttempts.reduce((s, a) => s + (a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0), 0) / totalAttempts)
    : null;

  const statusColor = allAttempted ? "emerald" : totalAttempts > 0 ? "amber" : "slate";
  const statusLabel = allAttempted ? "All Attempted" : totalAttempts > 0 ? "In Progress" : "Pending";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:shadow-cardHover hover:-translate-y-0.5">
      {/* Top strip */}
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-brand-ink">{test.title}</h3>
            {test.examPattern && (
              <span className="mt-1.5 inline-block rounded-full bg-brand-surface px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                {test.examPattern}
              </span>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold
            ${statusColor === "emerald" ? "bg-emerald-100 text-emerald-700" :
              statusColor === "amber"   ? "bg-amber-100 text-amber-700" :
                                          "bg-slate-100 text-slate-500"}`}>
            {statusLabel}
          </span>
        </div>

        {/* Meta chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {test.durationMinutes && (
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              <IcClock />{test.durationMinutes} min
            </div>
          )}
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            <IcQ />{test.questions?.length ?? 0} Qs
          </div>
          {test.batch?.name && (
            <div className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
              {test.batch.name}
            </div>
          )}
        </div>
      </div>

      {/* Attempts by learner */}
      <div className="p-5 space-y-3">
        {linkedLearners.length > 0 ? (
          linkedLearners.map((ll) => {
            const attempt = myAttempts.find((a) => String(a.learner?._id) === String(ll._id));
            const pct = attempt && attempt.maxScore
              ? Math.round((attempt.score / attempt.maxScore) * 100)
              : null;
            const initials = (ll.name || "?").split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");

            return (
              <div key={ll._id} className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-teal-700">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-brand-ink truncate">{ll.name}</p>
                  {attempt ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-400">
                        {attempt.score}/{attempt.maxScore} pts
                      </p>
                      {attempt.timeTakenSeconds && (
                        <p className="text-[10px] text-slate-400">
                          · {Math.ceil(attempt.timeTakenSeconds / 60)} min
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-600 font-medium">Not attempted yet</p>
                  )}
                </div>
                {attempt ? (
                  pct !== null ? <ScoreRing pct={pct} /> : (
                    <span className="text-[11px] font-bold text-emerald-600">Done</span>
                  )
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">Pending</span>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">No linked learners</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        {avgPct !== null ? (
          <div>
            <p className="text-[10px] text-slate-400">Avg Score</p>
            <p className="text-sm font-extrabold" style={{ color: avgPct >= 70 ? "#10B981" : avgPct >= 50 ? "#F59E0B" : "#EF4444" }}>
              {avgPct}%
            </p>
          </div>
        ) : (
          <div />
        )}
        <Link
          to={`/parent/exam/tests/${test._id}/leaderboard`}
          className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100 transition"
        >
          <IcLeaderboard />
          Leaderboard
        </Link>
      </div>
    </article>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────────── */
const ParentExamPage = () => {
  const [query, setQuery]     = useState("");
  const [statusTab, setStatus] = useState("all"); // "all" | "attempted" | "pending"

  const { data, loading } = useFetch(() => api.get("/exam/parent/summary"), []);

  const tests           = data?.tests    || [];
  const attempts        = data?.attempts || [];
  const linkedLearners  = useMemo(() => {
    // Collect unique learners from attempts (since API doesn't directly return them)
    const map = new Map();
    attempts.forEach((a) => {
      if (a.learner?._id) map.set(String(a.learner._id), a.learner);
    });
    return [...map.values()];
  }, [attempts]);

  // Group attempts by test
  const attemptsByTest = useMemo(() => {
    const m = new Map();
    attempts.forEach((a) => {
      const tid = String(a.test?._id || a.test);
      if (!m.has(tid)) m.set(tid, []);
      m.get(tid).push(a);
    });
    return m;
  }, [attempts]);

  const attemptedTestIds = useMemo(() => new Set(attempts.map((a) => String(a.test?._id))), [attempts]);
  const pendingCount     = tests.filter((t) => !attemptedTestIds.has(String(t._id))).length;
  const attemptedCount   = tests.filter((t) => attemptedTestIds.has(String(t._id))).length;

  const bestScore = attempts.length
    ? Math.max(...attempts.map((a) => (a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0)))
    : 0;

  const filtered = useMemo(() => tests.filter((t) => {
    const qOk = !query.trim() || `${t.title} ${t.examPattern || ""} ${t.batch?.name || ""}`.toLowerCase().includes(query.toLowerCase());
    const sOk = statusTab === "all"
      ? true
      : statusTab === "attempted"
        ? attemptedTestIds.has(String(t._id))
        : !attemptedTestIds.has(String(t._id));
    return qOk && sOk;
  }), [tests, query, statusTab, attemptedTestIds]);

  if (loading) return <Loader label="Loading test data…" />;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Tests & Attempts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track mock tests available to your child and see their attempt status.
          </p>
        </div>
        <Link
          to="/parent/exam/leaderboards"
          className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
        >
          <IcLeaderboard />
          All Leaderboards
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Available Tests",   val: tests.length,    sub: "Published for linked learners",  color: "#1A4FA0", bg: "bg-brand-surface" },
          { label: "Pending",           val: pendingCount,    sub: "No attempt submitted yet",        color: "#F59E0B", bg: "bg-amber-50"     },
          { label: "Best Score",        val: `${bestScore}%`, sub: "Across linked learner attempts",  color: "#10B981", bg: "bg-emerald-50"   },
        ].map(({ label, val, sub, color, bg }) => (
          <div key={label} className={`rounded-2xl border border-slate-200/70 ${bg} p-5 shadow-card`}>
            <p className="text-2xl font-extrabold" style={{ color }}>{val}</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">{label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <IcSearch />
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 transition"
              placeholder="Search tests by name or exam pattern…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { key: "all",       label: `All (${tests.length})` },
              { key: "attempted", label: `Attempted (${attemptedCount})` },
              { key: "pending",   label: `Pending (${pendingCount})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  statusTab === key
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-brand-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Showing <span className="font-bold text-teal-700">{filtered.length}</span> of {tests.length} tests
        </p>
      </div>

      {/* ── Test Grid ── */}
      {!filtered.length ? (
        <EmptyState
          title="No tests found"
          description={query || statusTab !== "all" ? "Try adjusting your filters." : "No published tests for linked learners yet."}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((test) => (
            <TestCard
              key={test._id}
              test={test}
              myAttempts={attemptsByTest.get(String(test._id)) || []}
              linkedLearners={linkedLearners}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentExamPage;
