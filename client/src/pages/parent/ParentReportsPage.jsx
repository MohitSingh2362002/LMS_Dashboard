import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const Bar = ({ value, tone = "teal" }) => (
  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
    <div
      className={`h-full ${tone === "amber" ? "bg-amber-500" : tone === "rose" ? "bg-rose-500" : "bg-teal-700"}`}
      style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }}
    />
  </div>
);

const ParentReportsPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/reports"), []);
  const reports = data.reports || [];

  if (loading) return <Loader label="Loading growth reports..." />;

  if (!reports.length) {
    return <EmptyState title="No learner reports yet" description="Reports appear once learners are linked and start activity." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Trust Builder</p>
        <h2 className="font-display text-3xl text-slate-900">Growth Reports</h2>
        <p className="mt-2 text-sm text-slate-500">Visual academic progress, score trends, ranks, and weak areas for linked learners.</p>
      </div>

      {reports.map((report) => (
        <section key={report.learner._id} className="space-y-5 rounded-[28px] bg-white p-6 shadow-panel">
          <div>
            <h3 className="font-display text-2xl text-slate-900">{report.learner.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{report.learner.email}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Avg Course" value={`${report.summary.averageProgress}%`} helper={`${report.summary.courses} active courses`} />
            <StatCard label="Avg Test" value={`${report.summary.averageTestScore}%`} helper={`${report.summary.attempts} attempts`} />
            <StatCard label="Weak Areas" value={report.weakTopics.length} helper="Topics below 60% accuracy" />
            <StatCard label="Latest Rank" value={report.trend.at(-1)?.rank || "-"} helper={report.trend.at(-1)?.testTitle || "No ranked attempt"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <div className="rounded-3xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-900">Course Progress</h4>
              <div className="mt-4 space-y-4">
                {report.courseProgress.map((course) => (
                  <div key={course.enrollmentId}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{course.courseTitle}</span>
                      <span className="text-slate-500">{course.progress}%</span>
                    </div>
                    <Bar value={course.progress} />
                  </div>
                ))}
                {!report.courseProgress.length ? <p className="text-sm text-slate-500">No course progress yet.</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-900">Test Trend</h4>
              <div className="mt-4 space-y-4">
                {report.trend.slice(-6).map((attempt) => (
                  <div key={attempt.attemptId}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{attempt.testTitle}</span>
                      <span className="text-slate-500">{attempt.percentage}% · Rank {attempt.rank || "-"}</span>
                    </div>
                    <Bar value={attempt.percentage} tone={attempt.percentage < 50 ? "rose" : attempt.percentage < 70 ? "amber" : "teal"} />
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(attempt.submittedAt)}</p>
                  </div>
                ))}
                {!report.trend.length ? <p className="text-sm text-slate-500">No test attempts yet.</p> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <div className="rounded-3xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-900">Subject Performance</h4>
              <div className="mt-4 space-y-4">
                {report.subjectStats.slice(0, 6).map((subject) => (
                  <div key={subject.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{subject.name}</span>
                      <span className="text-slate-500">{subject.accuracy}%</span>
                    </div>
                    <Bar value={subject.accuracy} tone={subject.accuracy < 50 ? "rose" : subject.accuracy < 70 ? "amber" : "teal"} />
                  </div>
                ))}
                {!report.subjectStats.length ? <p className="text-sm text-slate-500">No subject data yet.</p> : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 p-5">
              <h4 className="font-semibold text-slate-900">Weak Topics</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                {report.weakTopics.map((topic) => (
                  <span key={topic.name} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {topic.name} · {topic.accuracy}%
                  </span>
                ))}
                {!report.weakTopics.length ? <p className="text-sm text-slate-500">No weak topic detected yet.</p> : null}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default ParentReportsPage;
