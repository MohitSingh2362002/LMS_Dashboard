import { useMemo } from "react";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import ReportCard from "../../components/ReportCard";
import ChartCard from "../../components/charts/ChartCard";
import LineChart from "../../components/charts/LineChart";
import BarChart from "../../components/charts/BarChart";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const ParentReportsPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/reports"), []);
  const reports = data.reports || [];

  if (loading) return <Loader variant="skeleton" label="Loading growth reports..." />;

  if (!reports.length) {
    return <EmptyState title="No learner reports yet" description="Reports appear once learners are linked and start activity." icon="📊" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Trust Builder</p>
        <h2 className="font-display text-3xl text-slate-900">Growth Reports</h2>
        <p className="mt-2 text-sm text-slate-500">Visual academic progress, score trends, ranks, and weak areas for linked learners.</p>
      </div>

      {reports.map((report) => (
        <LearnerReport key={report.learner._id} report={report} />
      ))}
    </div>
  );
};

const LearnerReport = ({ report }) => {
  const trendChart = useMemo(() => ({
    labels: report.trend.slice(-8).map((a) => a.testTitle?.slice(0, 10) || "Test"),
    values: report.trend.slice(-8).map((a) => a.percentage || 0),
  }), [report.trend]);

  const subjectChart = useMemo(() => ({
    labels: report.subjectStats.slice(0, 6).map((s) => s.name),
    values: report.subjectStats.slice(0, 6).map((s) => s.accuracy),
  }), [report.subjectStats]);

  const courseChart = useMemo(() => ({
    labels: report.courseProgress.map((c) => c.courseTitle?.length > 15 ? c.courseTitle.slice(0, 15) + "…" : c.courseTitle),
    values: report.courseProgress.map((c) => c.progress),
  }), [report.courseProgress]);

  return (
    <section className="space-y-5">
      <div className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-lg font-bold uppercase text-white">
            {report.learner.name?.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-display text-2xl text-slate-900">{report.learner.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{report.learner.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Avg Course" value={`${report.summary.averageProgress}%`} helper={`${report.summary.courses} active courses`} icon="📚" accentColor="teal" trend={report.summary.averageProgress >= 50 ? "up" : "neutral"} />
        <StatCard label="Avg Test" value={`${report.summary.averageTestScore}%`} helper={`${report.summary.attempts} attempts`} icon="🏆" accentColor="indigo" trend={report.summary.averageTestScore >= 60 ? "up" : report.summary.averageTestScore >= 40 ? "neutral" : "down"} />
        <StatCard label="Weak Areas" value={report.weakTopics.length} helper="Topics below 60% accuracy" icon="⚠" accentColor="amber" />
        <StatCard label="Latest Rank" value={report.trend.at(-1)?.rank || "—"} helper={report.trend.at(-1)?.testTitle || "No ranked attempt"} icon="🥇" accentColor="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Score Trend" subtitle="Test performance over time">
          {report.trend.length > 0 ? (
            <LineChart
              labels={trendChart.labels}
              datasets={[{ label: "Score %", data: trendChart.values }]}
              height={260}
            />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No test attempts yet.</p>
          )}
        </ChartCard>

        <ChartCard title="Subject Performance" subtitle="Accuracy breakdown by subject">
          {report.subjectStats.length > 0 ? (
            <BarChart
              labels={subjectChart.labels}
              datasets={[{
                label: "Accuracy %",
                data: subjectChart.values,
                backgroundColor: subjectChart.values.map((v) =>
                  v >= 70 ? "rgba(15, 118, 110, 0.85)" : v >= 50 ? "rgba(217, 119, 6, 0.85)" : "rgba(225, 29, 72, 0.85)"
                ),
              }]}
              height={260}
            />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No subject data yet.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Course Progress">
          {report.courseProgress.length > 0 ? (
            <BarChart
              labels={courseChart.labels}
              datasets={[{ label: "Progress %", data: courseChart.values, backgroundColor: "rgba(15, 118, 110, 0.85)" }]}
              height={220}
              horizontal
            />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No course progress yet.</p>
          )}
        </ChartCard>

        <ReportCard
          name={report.learner.name}
          subjects={report.subjectStats.slice(0, 6)}
          overallPercent={report.summary.averageTestScore}
          rank={report.trend.at(-1)?.rank}
          avatarInitials={report.learner.name?.slice(0, 2)}
        />
      </div>

      {report.weakTopics.length > 0 ? (
        <ChartCard title="Weak Topics" subtitle="Topics below 60% accuracy that need extra focus">
          <div className="flex flex-wrap gap-2">
            {report.weakTopics.map((topic) => (
              <span key={topic.name} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                {topic.name} · {topic.accuracy}%
              </span>
            ))}
          </div>
        </ChartCard>
      ) : null}
    </section>
  );
};

export default ParentReportsPage;
