import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const ExamLeaderboardsPage = ({ basePath = "/learner/exam" }) => {
  const { data: tests, loading } = useFetch(() => api.get("/exam/tests"), []);

  if (loading) return <Loader label="Loading leaderboards..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Leaderboards</h2>
        <p className="mt-2 text-sm text-slate-500">Open rank analysis for tests available to your batch.</p>
      </div>

      {!tests.length ? (
        <EmptyState title="No leaderboards yet" description="Published tests for your batch will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => (
            <article key={test._id} className="rounded-[28px] bg-white p-6 shadow-panel">
              <p className="font-semibold text-slate-900">{test.title}</p>
              <p className="mt-2 text-sm text-slate-500">{test.examPattern} · {test.batch?.name || "Open test"}</p>
              <Link to={`${basePath}/tests/${test._id}/leaderboard`} className="mt-5 inline-flex rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
                View Leaderboard
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamLeaderboardsPage;
