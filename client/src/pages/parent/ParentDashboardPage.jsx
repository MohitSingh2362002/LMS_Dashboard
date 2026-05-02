import { useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const ParentDashboardPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/dashboard"), []);

  const enrollments = (data && data.enrollments) || [];
  const learners = (data && data.linkedLearners) || [];
  const batches = (data && data.batches) || [];
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((total, item) => total + (item.progress || 0), 0) / enrollments.length)
    : 0;
  const completedCount = enrollments.filter((e) => e.progress >= 100).length;

  const progressChart = useMemo(() => ({
    labels: enrollments.slice(0, 8).map((e) => {
      const name = e.learner?.name?.split(" ")[0] || "Learner";
      const course = e.course?.title || "Course";
      return `${name} – ${course.length > 10 ? course.slice(0, 10) + "…" : course}`;
    }),
    values: enrollments.slice(0, 8).map((e) => e.progress || 0),
  }), [enrollments]);

  if (loading) return <Loader variant="skeleton" label="Loading parent dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Trust Builder</p>
          <h2 className="font-display text-3xl text-slate-900">Parent Growth Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">
            Linked learner progress, batch mentors, and academic activity in one calm view.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Linked Learners" value={learners.length} helper="Children connected to this account" icon="👦" accentColor="teal" />
        <StatCard label="Active Courses" value={enrollments.length} helper="Current course enrollments" icon="📚" accentColor="indigo" />
        <StatCard label="Completed" value={completedCount} helper="Courses finished at 100%" icon="🎓" accentColor="amber" />
        <StatCard label="Avg Progress" value={`${averageProgress}%`} helper="Across visible enrollments" icon="📊" accentColor="rose" trend={averageProgress >= 50 ? "up" : averageProgress >= 25 ? "neutral" : "down"} />
      </div>

      {!learners.length ? (
        <EmptyState title="No learner linked yet" description="Ask the admin to link this parent account with a learner." icon="🔗" />
      ) : (
        <div className="space-y-6">
          <section className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl text-slate-900">Growth Reports</h3>
                <p className="mt-2 text-sm text-slate-500">Open visual score trends, rank snapshots, and weak-topic analysis.</p>
              </div>
              <Link to="/parent/reports" className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-800">
                View Reports
              </Link>
            </div>
          </section>

          {enrollments.length > 0 ? (
            <ChartCard title="Progress Overview" subtitle="Course progress for each linked learner">
              <BarChart
                labels={progressChart.labels}
                datasets={[{ label: "Progress %", data: progressChart.values }]}
                height={240}
                horizontal
              />
            </ChartCard>
          ) : null}

          <section className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
            <h3 className="font-display text-2xl text-slate-900">Performance Snapshot</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="rounded-3xl border border-slate-100 p-5 transition hover:border-teal-200 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{enrollment.learner?.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{enrollment.course?.title}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      enrollment.progress >= 100 ? "bg-emerald-50 text-emerald-700" :
                      enrollment.progress >= 50 ? "bg-teal-50 text-teal-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {enrollment.progress || 0}% complete
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${enrollment.progress || 0}%` }} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Updated {formatDate(enrollment.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {batches.length > 0 ? (
            <ChartCard title="Batch Placements" subtitle="Batch assignments and mentors">
              <div className="grid gap-4 md:grid-cols-2">
                {batches.map((batch) => (
                  <div key={batch._id} className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
                    <p className="font-semibold text-slate-900">{batch.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{batch.course?.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold capitalize text-indigo-700">{batch.performanceGroup}</span>
                      <span className="text-xs text-slate-400">• Mentor: {batch.mentor?.name || "TBA"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
