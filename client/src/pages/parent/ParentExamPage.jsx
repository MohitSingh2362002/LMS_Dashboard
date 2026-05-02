import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const ParentExamPage = () => {
  const { data, loading } = useFetch(() => api.get("/exam/parent/summary"), []);

  if (loading) return <Loader label="Loading learner tests..." />;

  const tests = data.tests || [];
  const attempts = data.attempts || [];
  const attemptedTestIds = new Set(attempts.map((attempt) => attempt.test?._id));
  const pendingCount = tests.filter((test) => !attemptedTestIds.has(test._id)).length;
  const bestScore = attempts.length ? Math.max(...attempts.map((attempt) => attempt.score || 0)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Trust Builder</p>
        <h2 className="font-display text-3xl text-slate-900">Tests & Attempts</h2>
        <p className="mt-2 text-sm text-slate-500">Track mock tests available to linked learners and see whether they attempted them.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Available Tests" value={tests.length} helper="For linked learners and batches" />
        <StatCard label="Pending" value={pendingCount} helper="No attempt submitted yet" />
        <StatCard label="Best Score" value={bestScore} helper="Across linked learner attempts" />
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h3 className="font-display text-2xl">Available Tests</h3>
        {!tests.length ? <div className="mt-5"><EmptyState title="No tests assigned" description="Published tests for linked learners will appear here." /></div> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => {
            const testAttempts = attempts.filter((attempt) => attempt.test?._id === test._id);

            return (
              <article key={test._id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{test.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{test.examPattern} · {test.batch?.name || "Open test"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${testAttempts.length ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {testAttempts.length ? "Attempted" : "Pending"}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {testAttempts.map((attempt) => (
                    <div key={attempt._id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">{attempt.learner?.name}</span> scored {attempt.score}/{attempt.maxScore}
                      <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(attempt.submittedAt)}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ParentExamPage;
