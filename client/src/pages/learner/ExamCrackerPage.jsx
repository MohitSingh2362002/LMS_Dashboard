import { useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import ReportCard from "../../components/ReportCard";
import ChartCard from "../../components/charts/ChartCard";
import LineChart from "../../components/charts/LineChart";
import DoughnutChart from "../../components/charts/DoughnutChart";
import BarChart from "../../components/charts/BarChart";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const ExamCrackerPage = () => {
  const { data: tests, loading: loadingTests } = useFetch(() => api.get("/exam/tests"), []);
  const { data: attempts, loading: loadingAttempts } = useFetch(() => api.get("/exam/attempts/mine"), []);

  const bestScore = useMemo(
    () => (attempts.length ? Math.max(...attempts.map((a) => a.score || 0)) : 0),
    [attempts]
  );

  const weakTopics = useMemo(
    () => [...new Set(attempts.flatMap((a) => a.weakTopics || []))].slice(0, 5),
    [attempts]
  );

  const scoreTrend = useMemo(() => {
    const sorted = [...attempts].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
    return {
      labels: sorted.map((a) => a.test?.title?.slice(0, 12) || formatDate(a.submittedAt)?.slice(0, 6)),
      values: sorted.map((a) => (a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0)),
    };
  }, [attempts]);

  const subjectAccuracy = useMemo(() => {
    const stats = {};
    attempts.forEach((a) => {
      (a.answers || []).forEach((ans) => {
        const subj = ans.question?.subject || "General";
        if (!stats[subj]) stats[subj] = { correct: 0, total: 0 };
        stats[subj].total += 1;
        if (ans.isCorrect) stats[subj].correct += 1;
      });
    });
    return Object.entries(stats).map(([name, s]) => ({
      name,
      accuracy: s.total ? Math.round((s.correct / s.total) * 100) : 0,
      correct: s.correct,
      total: s.total,
    }));
  }, [attempts]);

  const answerDistribution = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    attempts.forEach((a) => {
      correct += a.correctCount || 0;
      incorrect += a.incorrectCount || 0;
      skipped += a.skippedCount || 0;
    });
    return { correct, incorrect, skipped };
  }, [attempts]);

  const latestRank = useMemo(() => {
    if (!attempts.length) return null;
    const sorted = [...attempts].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return sorted[0]?.rank || null;
  }, [attempts]);

  const overallPercent = useMemo(() => {
    if (!attempts.length) return 0;
    const total = attempts.reduce((s, a) => s + (a.maxScore ? (a.score / a.maxScore) * 100 : 0), 0);
    return Math.round(total / attempts.length);
  }, [attempts]);

  if (loadingTests || loadingAttempts) return <Loader variant="skeleton" label="Loading Exam Cracker..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Adaptive Mock Tests</h2>
        <p className="mt-2 text-sm text-slate-500">Practice NEET and Olympiad tests, review weak topics, and compare batch rank.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available Tests" value={tests.length} helper="Published for your batch" icon="📝" accentColor="teal" />
        <StatCard label="Attempts" value={attempts.length} helper="Submitted mock tests" icon="✍️" accentColor="indigo" />
        <StatCard label="Best Score" value={bestScore} helper="Highest score so far" icon="🏆" accentColor="amber" />
        <StatCard label="Avg Score" value={`${overallPercent}%`} helper="Across all attempts" icon="📊" accentColor="rose" trend={overallPercent >= 60 ? "up" : overallPercent >= 40 ? "neutral" : "down"} />
      </div>

      {attempts.length > 0 ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Score Trend" subtitle="Your performance over time">
              <LineChart
                labels={scoreTrend.labels}
                datasets={[{ label: "Score %", data: scoreTrend.values }]}
                height={260}
              />
            </ChartCard>

            <ChartCard title="Subject Accuracy" subtitle="How you perform in each subject">
              {subjectAccuracy.length > 0 ? (
                <DoughnutChart
                  labels={subjectAccuracy.map((s) => s.name)}
                  data={subjectAccuracy.map((s) => s.accuracy)}
                  centerLabel={`${overallPercent}%`}
                  height={260}
                />
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">No subject data available yet.</p>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard title="Answer Distribution" subtitle="Correct vs Incorrect vs Skipped">
              <BarChart
                labels={["Correct", "Incorrect", "Skipped"]}
                datasets={[{
                  label: "Questions",
                  data: [answerDistribution.correct, answerDistribution.incorrect, answerDistribution.skipped],
                  backgroundColor: ["rgba(5, 150, 105, 0.85)", "rgba(225, 29, 72, 0.85)", "rgba(100, 116, 139, 0.85)"],
                }]}
                height={220}
              />
            </ChartCard>

            <ReportCard
              name="My Report Card"
              subjects={subjectAccuracy}
              overallPercent={overallPercent}
              rank={latestRank}
            />
          </div>
        </>
      ) : null}

      {weakTopics.length ? (
        <ChartCard title="Adaptive Focus" subtitle="Topics that need more practice">
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((topic) => (
              <span key={topic} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">{topic}</span>
            ))}
          </div>
        </ChartCard>
      ) : null}

      <ChartCard title="Available Tests">
        {!tests.length ? (
          <EmptyState title="No tests available" description="Published mock tests for your batch will appear here." icon="📋" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tests.map((test) => (
              <article key={test._id} className="rounded-3xl border border-slate-100 p-5 transition hover:border-teal-200 hover:shadow-md">
                <p className="font-semibold text-slate-900">{test.title}</p>
                <p className="mt-2 text-sm text-slate-500">{test.examPattern} · {test.durationMinutes} min · {test.questions?.length || 0} questions</p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{test.batch?.name || "Open test"}</p>
                <Link to={`/learner/exam/tests/${test._id}`} className="mt-5 inline-block rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-800">
                  Start Test
                </Link>
              </article>
            ))}
          </div>
        )}
      </ChartCard>

      {attempts.length > 0 ? (
        <ChartCard title="Recent Attempts">
          <div className="space-y-3">
            {attempts.slice(0, 6).map((attempt) => (
              <div key={attempt._id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-900">{attempt.test?.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(attempt.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                    {attempt.score}/{attempt.maxScore}
                  </span>
                  <Link to={`/learner/exam/results/${attempt._id}`} className="text-sm font-medium text-teal-700 hover:underline">
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      ) : null}
    </div>
  );
};

export default ExamCrackerPage;
