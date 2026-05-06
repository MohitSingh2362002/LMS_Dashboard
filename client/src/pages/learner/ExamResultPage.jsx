import { Link, useLocation, useParams } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

/* ── Helpers ──────────────────────────────────────────────────────────── */
const fmtDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const buildSections = (attempt) => {
  const map = new Map();
  (attempt.answers || []).forEach((ans) => {
    const name = ans.question?.subject || "General";
    const cur  = map.get(name) || { name, correct: 0, incorrect: 0, skipped: 0, score: 0, total: 0, timeSec: 0 };
    cur.total   += 1;
    cur.score   += ans.score || 0;
    cur.timeSec += ans.timeTakenSeconds || 0;
    if (ans.isCorrect) cur.correct += 1;
    else if ((ans.selectedOptions || []).length || ans.numericAnswer !== undefined) cur.incorrect += 1;
    else cur.skipped += 1;
    map.set(name, cur);
  });
  const rows = [...map.values()];
  if (!rows.length) {
    rows.push({
      name:      attempt.test?.examPattern || "Overall",
      correct:   attempt.correctCount,
      incorrect: attempt.incorrectCount,
      skipped:   attempt.skippedCount,
      score:     attempt.score,
      total:     attempt.correctCount + attempt.incorrectCount + attempt.skippedCount,
      timeSec:   attempt.timeTakenSeconds || 0,
    });
  }
  return rows.map((r) => ({
    ...r,
    percentile: r.total ? Math.round((r.score / Math.max(1, attempt.maxScore)) * 1000) / 10 : 0,
    accuracy:   r.total ? Math.round((r.correct / r.total) * 1000) / 10 : 0,
  }));
};

/* ── Donut ring ───────────────────────────────────────────────────────── */
const Ring = ({ pct, color, size = 80, stroke = 8 }) => {
  const r  = (size - stroke) / 2;
  const c  = 2 * Math.PI * r;
  const dashOffset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
};

/* ── Metric ring card ─────────────────────────────────────────────────── */
const RingCard = ({ label, value, sub, pct, color }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card text-center">
    <div className="relative">
      <Ring pct={pct} color={color} size={76} stroke={7} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-extrabold" style={{ color }}>{Math.round(pct)}%</span>
      </div>
    </div>
    <div>
      <p className="text-lg font-extrabold text-brand-ink">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </div>
  </div>
);

/* ── Big Score Card ───────────────────────────────────────────────────── */
const ScoreHero = ({ score, max, rank, accuracy, time }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {/* Score */}
    <div className="xl:col-span-2 flex items-center gap-6 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent p-6 text-white shadow-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Your Score</p>
        <p className="mt-1 text-5xl font-extrabold">
          {score}
          <span className="text-xl font-medium text-white/60"> / {max}</span>
        </p>
        <p className="mt-2 text-sm text-white/70">
          {max > 0 ? Math.round((score / max) * 100) : 0}% of total marks obtained
        </p>
      </div>
      <div className="ml-auto">
        <Ring pct={max > 0 ? (score / max) * 100 : 0} color="#ffffff" size={80} stroke={7} />
      </div>
    </div>

    {/* Rank */}
    <div className="flex flex-col justify-center rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rank</p>
      <p className="mt-2 text-4xl font-extrabold text-brand-primary">
        {rank ? `#${rank}` : "—"}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">Updates with leaderboard data</p>
    </div>

    {/* Accuracy */}
    <div className="flex flex-col justify-center rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accuracy</p>
      <p className="mt-2 text-4xl font-extrabold text-emerald-600">{accuracy}%</p>
      <p className="mt-1 text-[11px] text-slate-400">Time taken: {time}</p>
    </div>
  </div>
);

/* ── Progress bar metric ──────────────────────────────────────────────── */
const BarMetric = ({ label, value, sub, pct, color }) => (
  <div>
    <div className="flex items-center justify-between">
      <p className="text-sm font-bold text-brand-ink">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct || 0)}%`, backgroundColor: color }}
      />
    </div>
    {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
  </div>
);

/* ── Section table row ────────────────────────────────────────────────── */
const SectionRow = ({ s }) => (
  <tr className="border-t border-slate-100 hover:bg-slate-50 transition">
    <td className="px-5 py-4 font-semibold text-brand-primary text-sm">{s.name}</td>
    <td className="px-5 py-4 text-sm">{s.score}</td>
    <td className="px-5 py-4 text-sm">{s.percentile}%</td>
    <td className="px-5 py-4 text-sm text-emerald-600 font-semibold">{s.correct}</td>
    <td className="px-5 py-4 text-sm text-red-500 font-semibold">{s.incorrect}</td>
    <td className="px-5 py-4 text-sm text-slate-500">{s.skipped}</td>
    <td className="px-5 py-4">
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
        s.accuracy >= 70 ? "bg-emerald-100 text-emerald-700" :
        s.accuracy >= 40 ? "bg-amber-100 text-amber-700" :
        "bg-red-100 text-red-600"
      }`}>
        {s.accuracy}%
      </span>
    </td>
    <td className="px-5 py-4 text-sm text-slate-500">{fmtDuration(s.timeSec || 0)}</td>
  </tr>
);

/* ── Comparison bar ───────────────────────────────────────────────────── */
const CompareBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[80px_1fr_60px] items-center gap-3 text-sm">
      <span className="text-right text-xs font-semibold text-slate-500 truncate">{label}</span>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-bold" style={{ color }}>{value}</span>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────── */
const ExamResultPage = () => {
  const { state } = useLocation();
  const { attemptId } = useParams();
  const { data: attempts, loading } = useFetch(() => api.get("/exam/attempts/mine"), []);
  const attempt = state?.attempt || attempts.find((a) => a._id === attemptId);

  if (loading && !state?.attempt) return <Loader label="Loading test analytics…" />;
  if (!attempt) return <EmptyState title="Result not available" description="Open this page after submitting a mock test." />;

  const total    = attempt.answers?.length || (attempt.correctCount + attempt.incorrectCount + attempt.skippedCount) || 1;
  const accuracy = total ? Math.round((attempt.correctCount / total) * 1000) / 10 : 0;
  const time     = fmtDuration(attempt.timeTakenSeconds || 0);
  const sections = buildSections(attempt);
  const maxScore = attempt.maxScore || 1;

  /* fake topper / avg for comparison (real values would come from leaderboard API) */
  const topperScore = Math.round(maxScore * 0.95);
  const avgScore    = Math.round(maxScore * 0.60);

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">{attempt.test?.title || "Mock Test Result"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} Questions · {maxScore} Marks ·{" "}
            Attempted on {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          {attempt.test?._id && (
            <Link
              to={`/learner/exam/tests/${attempt.test._id}`}
              className="rounded-xl border border-brand-primary px-5 py-2 text-sm font-bold text-brand-primary hover:bg-brand-surface transition"
            >
              Reattempt
            </Link>
          )}
          <Link
            to="/learner/exam"
            className="rounded-xl bg-brand-primary px-5 py-2 text-sm font-bold text-white hover:bg-brand-ink transition"
          >
            View Solutions
          </Link>
        </div>
      </div>

      {/* ── Score hero ── */}
      <ScoreHero
        score={attempt.score}
        max={maxScore}
        rank={attempt.rank}
        accuracy={accuracy}
        time={time}
      />

      {/* ── Progress breakdown ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="mb-6 text-base font-extrabold text-brand-ink">Your Progress</h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <RingCard
            label="Correct"
            value={`${attempt.correctCount}/${total}`}
            sub={`+${attempt.score} marks obtained`}
            pct={(attempt.correctCount / total) * 100}
            color="#1A4FA0"
          />
          <RingCard
            label="Incorrect"
            value={`${attempt.incorrectCount}/${total}`}
            sub="Negative marking applied"
            pct={(attempt.incorrectCount / total) * 100}
            color="#EF4444"
          />
          <RingCard
            label="Skipped"
            value={`${attempt.skippedCount}/${total}`}
            sub="No marks for skipped"
            pct={(attempt.skippedCount / total) * 100}
            color="#94A3B8"
          />
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <BarMetric label="Accuracy" value={`${accuracy}%`} pct={accuracy} color="#10B981" sub="Correct answers ratio" />
          <BarMetric label="Completed" value="100%" pct={100} color="#2E7FD9" sub="All questions attempted or skipped" />
          <BarMetric label="Time Taken" value={time} pct={85} color="#F0A500" sub="Out of allotted time" />
        </div>
      </div>

      {/* ── Section-wise performance ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-brand-ink">Section-wise Performance</h2>
          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-primary">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Section", "Score", "Percentile", "Correct", "Incorrect", "Skipped", "Accuracy", "Time"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => <SectionRow key={s.name} s={s} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Performance Comparison ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <h2 className="mb-5 text-base font-extrabold text-brand-ink">Performance Comparison</h2>
        <div className="space-y-3">
          <CompareBar label="You"     value={attempt.score} max={maxScore} color="#1A4FA0" />
          <CompareBar label="Topper"  value={topperScore}   max={maxScore} color="#10B981" />
          <CompareBar label="Average" value={avgScore}      max={maxScore} color="#F59E0B" />
        </div>
        <div className="mt-4 flex gap-4">
          {[
            { label: "You",     color: "#1A4FA0" },
            { label: "Topper",  color: "#10B981" },
            { label: "Average", color: "#F59E0B" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weak areas CTA ── */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">
            🎯
          </div>
          <div>
            <h2 className="text-base font-extrabold text-amber-900">Strengthen Your Weak Areas</h2>
            <p className="mt-1 text-sm text-amber-700">
              {attempt.weakTopics?.length
                ? `Focus on: ${attempt.weakTopics.join(", ")}.`
                : sections.length > 0 && sections.some((s) => s.accuracy < 60)
                  ? `Your weakest section is "${sections.sort((a, b) => a.accuracy - b.accuracy)[0].name}" with ${sections.sort((a, b) => a.accuracy - b.accuracy)[0].accuracy}% accuracy.`
                  : "Keep practising daily to maintain your edge!"}
            </p>
            <Link
              to="/learner/exam"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600 transition"
            >
              Practice Now
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResultPage;
