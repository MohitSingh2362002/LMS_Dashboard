import { Link, useLocation } from "react-router-dom";
import EmptyState from "../../components/EmptyState";

const ExamResultPage = () => {
  const { state } = useLocation();
  const attempt = state?.attempt;

  if (!attempt) {
    return <EmptyState title="Result not available" description="Open this page after submitting a mock test." />;
  }

  const accuracy = attempt.answers?.length ? Math.round((attempt.correctCount / attempt.answers.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Result Analysis</h2>
        <p className="mt-2 text-sm text-slate-500">Review score, accuracy, weak topics, and next practice focus.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[24px] bg-white p-6 shadow-panel"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Score</p><p className="mt-3 font-display text-4xl">{attempt.score}/{attempt.maxScore}</p></div>
        <div className="rounded-[24px] bg-white p-6 shadow-panel"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Accuracy</p><p className="mt-3 font-display text-4xl">{accuracy}%</p></div>
        <div className="rounded-[24px] bg-white p-6 shadow-panel"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Correct</p><p className="mt-3 font-display text-4xl">{attempt.correctCount}</p></div>
        <div className="rounded-[24px] bg-white p-6 shadow-panel"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Incorrect</p><p className="mt-3 font-display text-4xl">{attempt.incorrectCount}</p></div>
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h3 className="font-display text-2xl">Adaptive Focus</h3>
        {attempt.weakTopics?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {attempt.weakTopics.map((topic) => <span key={topic} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{topic}</span>)}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No weak topics detected from this attempt.</p>
        )}
      </section>

      <Link to="/learner/exam" className="inline-flex rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">Back to Exam Cracker</Link>
    </div>
  );
};

export default ExamResultPage;
