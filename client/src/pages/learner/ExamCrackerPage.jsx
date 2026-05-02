import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const ExamCrackerPage = () => {
  const { data: tests, loading: loadingTests } = useFetch(() => api.get("/exam/tests"), []);
  const { data: attempts, loading: loadingAttempts } = useFetch(() => api.get("/exam/attempts/mine"), []);

  if (loadingTests || loadingAttempts) return <Loader label="Loading Exam Cracker..." />;

  const bestScore = attempts.length ? Math.max(...attempts.map((attempt) => attempt.score || 0)) : 0;
  const weakTopics = [...new Set(attempts.flatMap((attempt) => attempt.weakTopics || []))].slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Adaptive Mock Tests</h2>
        <p className="mt-2 text-sm text-slate-500">Practice NEET and Olympiad tests, review weak topics, and compare batch rank.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Available Tests" value={tests.length} helper="Published for your batch" />
        <StatCard label="Attempts" value={attempts.length} helper="Submitted mock tests" />
        <StatCard label="Best Score" value={bestScore} helper="Highest score so far" />
      </div>

      {weakTopics.length ? (
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl text-slate-900">Adaptive Focus</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {weakTopics.map((topic) => (
              <span key={topic} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{topic}</span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h3 className="font-display text-2xl">Available Tests</h3>
        {!tests.length ? <div className="mt-5"><EmptyState title="No tests available" description="Published mock tests for your batch will appear here." /></div> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => (
            <article key={test._id} className="rounded-3xl border border-slate-100 p-5">
              <p className="font-semibold text-slate-900">{test.title}</p>
              <p className="mt-2 text-sm text-slate-500">{test.examPattern} · {test.durationMinutes} min · {test.questions?.length || 0} questions</p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{test.batch?.name || "Open test"}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/learner/exam/tests/${test._id}`} className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">Start Test</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h3 className="font-display text-2xl">Recent Attempts</h3>
        <div className="mt-5 space-y-3">
          {attempts.slice(0, 6).map((attempt) => (
            <div key={attempt._id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 p-4">
              <div>
                <p className="font-semibold text-slate-900">{attempt.test?.title}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(attempt.submittedAt)}</p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">{attempt.score}/{attempt.maxScore}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExamCrackerPage;
