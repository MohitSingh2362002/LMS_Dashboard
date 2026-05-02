import { useParams } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const ExamLeaderboardPage = () => {
  const { testId } = useParams();
  const { data: leaderboard, loading } = useFetch(() => api.get(`/exam/tests/${testId}/leaderboard`), [testId]);

  if (loading) return <Loader label="Loading leaderboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Batch Leaderboard</h2>
        <p className="mt-2 text-sm text-slate-500">Ranks use each learner’s best submitted attempt.</p>
      </div>

      {!leaderboard.length ? (
        <EmptyState title="No attempts yet" description="Leaderboard appears after learners submit the test." />
      ) : (
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="space-y-3">
            {leaderboard.map((attempt) => (
              <div key={attempt._id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 font-semibold text-white">{attempt.rank}</span>
                  <div>
                    <p className="font-semibold text-slate-900">{attempt.learner?.name}</p>
                    <p className="text-sm text-slate-500">{attempt.correctCount} correct · {attempt.timeTakenSeconds}s</p>
                  </div>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">{attempt.score}/{attempt.maxScore}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ExamLeaderboardPage;
