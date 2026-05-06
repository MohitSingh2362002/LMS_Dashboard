import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { CourseThumbnail } from "../../components/learner/LearnerPortalUI";

/* ── Icons ────────────────────────────────────────────────────────────── */
const IcSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const IcFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
const IcBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);
const IcStar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-yellow-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Test Card ────────────────────────────────────────────────────────── */
const TestCard = ({ test, attempt, isFree }) => {
  const scorePct = attempt?.maxScore
    ? Math.round((attempt.score / attempt.maxScore) * 100)
    : null;

  const pricingAmount = test.course?.pricing?.amount;
  const price = isFree
    ? "Free"
    : (pricingAmount > 0 ? `₹${pricingAmount}` : "Free");

  const hasAttempted = !!attempt;
  const btnLabel = hasAttempted ? "Reattempt" : isFree ? "Start Free" : "Start Test";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:shadow-cardHover hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div className="relative h-44">
        <CourseThumbnail
          title={test.title}
          thumbnail={test.course?.thumbnail}
          className="h-full"
          variant="test"
          zoom
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-yellow-400 px-2.5 py-0.5 text-[10px] font-bold text-black shadow">NEW</span>
          {test.examPattern && (
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-brand-primary shadow backdrop-blur-sm">
              {test.examPattern}
            </span>
          )}
        </div>
        {hasAttempted && (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
            ✓ Attempted
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-brand-ink">{test.title}</h3>

        {/* Meta chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            <IcClock />{test.durationMinutes ?? "—"} min
          </div>
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            <IcQ />{test.questions?.length ?? 0} Qs
          </div>
          {test.batch?.name && (
            <div className="flex items-center gap-1 rounded-full bg-brand-surface px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
              <IcBook />{test.batch.name}
            </div>
          )}
        </div>

        {/* Language */}
        <p className="mt-2.5 text-[11px] text-slate-500">
          Available in English &amp; Hindi
        </p>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          {[1,2,3,4,5].map((s) => <IcStar key={s} />)}
          <span className="ml-1 text-[11px] text-slate-500">4.5</span>
        </div>

        {/* Price + Score */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className={`text-lg font-extrabold ${isFree ? "text-emerald-600" : "text-brand-primary"}`}>
              {price}
            </p>
            {scorePct !== null && (
              <p className="text-[11px] font-semibold text-emerald-600">Last score: {scorePct}%</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/learner/exam/tests/${test._id}`}
            className="rounded-xl border border-brand-primary py-2 text-center text-xs font-bold text-brand-primary hover:bg-brand-surface transition"
          >
            Explore
          </Link>
          <Link
            to={`/learner/exam/tests/${test._id}`}
            className="rounded-xl bg-brand-primary py-2 text-center text-xs font-bold text-white hover:bg-brand-ink transition"
          >
            {btnLabel}
          </Link>
        </div>
      </div>
    </article>
  );
};

/* ── Section block ────────────────────────────────────────────────────── */
const TestSection = ({ title, tests, attemptByTest, isFree }) => {
  if (!tests.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-extrabold text-brand-ink">{title}</h2>
        <span className="rounded-full bg-brand-surface px-2.5 py-0.5 text-xs font-bold text-brand-primary">
          {tests.length}
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tests.map((t) => (
          <TestCard
            key={t._id}
            test={t}
            attempt={attemptByTest.get(String(t._id))}
            isFree={isFree}
          />
        ))}
      </div>
    </section>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────── */
const ExamCrackerPage = () => {
  const [query,       setQuery]       = useState("");
  const [typeFilter,  setTypeFilter]  = useState("");
  const [modeFilter,  setModeFilter]  = useState("");   // "free" | "paid" | ""

  const { data: tests,    loading: loadingTests }    = useFetch(() => api.get("/exam/tests"), []);
  const { data: attempts, loading: loadingAttempts } = useFetch(() => api.get("/exam/attempts/mine"), []);

  const attemptByTest = useMemo(() => {
    const m = new Map();
    attempts.forEach((a) => {
      const id = String(a.test?._id || a.test);
      if (!m.has(id)) m.set(id, a);
    });
    return m;
  }, [attempts]);

  const patterns = useMemo(() => [...new Set(tests.map((t) => t.examPattern).filter(Boolean))], [tests]);

  const filtered = useMemo(() => tests.filter((t) => {
    const text = `${t.title} ${t.examPattern} ${t.course?.title || ""}`.toLowerCase();
    const qOk  = !query.trim() || text.includes(query.toLowerCase());
    const tOk  = !typeFilter || t.examPattern === typeFilter;
    const isPaid = t.course?.pricing?.type === "paid" && (t.course?.pricing?.amount || 0) > 0;
    const mOk  = !modeFilter || (modeFilter === "free" ? !isPaid : isPaid);
    return qOk && tOk && mOk;
  }), [tests, query, typeFilter, modeFilter]);

  // Only mark as paid if both type="paid" AND a real amount>0 is set
  const isTestPaid = (t) => t.course?.pricing?.type === "paid" && (t.course?.pricing?.amount || 0) > 0;
  const paidTests = filtered.filter(isTestPaid);
  const freeTests = filtered.filter((t) => !isTestPaid(t));

  const hasFilters = query || typeFilter || modeFilter;
  const clearAll   = () => { setQuery(""); setTypeFilter(""); setModeFilter(""); };

  if (loadingTests || loadingAttempts) return <Loader variant="skeleton" label="Loading test series…" />;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Test Series</h1>
          <p className="mt-1 text-sm text-slate-500">
            Practice mock tests · {tests.length} available · {attempts.length} attempted
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-brand-surface px-4 py-2">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500">XP Points</p>
            <p className="text-sm font-extrabold text-brand-primary">{attempts.length * 10} XP</p>
          </div>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              <IcSearch />
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
              placeholder="Search tests by name, pattern or course…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <IcFilter />
            <select
              className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {patterns.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Mode filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <select
              className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-brand-primary hover:text-brand-primary transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="mt-3 text-[11px] text-slate-500">
          Showing <span className="font-bold text-brand-primary">{filtered.length}</span> of {tests.length} tests
          {hasFilters && " (filtered)"}
        </p>
      </div>

      {/* ── My Tests strip ── */}
      {attempts.length > 0 && (
        <div className="rounded-2xl border border-brand-primary/20 bg-brand-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-brand-primary">My Attempted Tests</p>
              <p className="text-xs text-slate-500">{attempts.length} test{attempts.length !== 1 ? "s" : ""} completed</p>
            </div>
            <div className="flex gap-2">
              {attempts.slice(0, 3).map((a) => (
                <Link
                  key={a._id}
                  to={`/learner/exam/results/${a._id}`}
                  className="rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-[11px] font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition truncate max-w-[140px]"
                >
                  {a.test?.title || "Test"}
                </Link>
              ))}
              {attempts.length > 3 && (
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500">
                  +{attempts.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Test Sections ── */}
      {!filtered.length ? (
        <EmptyState
          title="No tests found"
          description={hasFilters ? "Try adjusting your filters." : "No tests published yet for your batch."}
        />
      ) : (
        <div className="space-y-8">
          <TestSection title="Paid Test Series" tests={paidTests} attemptByTest={attemptByTest} isFree={false} />
          <TestSection title="Free Test Series"  tests={freeTests} attemptByTest={attemptByTest} isFree={true} />
        </div>
      )}
    </div>
  );
};

export default ExamCrackerPage;
