import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const ParentDashboardPage = () => {
  const { data, loading } = useFetch(() => api.get("/parent/dashboard"), []);

  if (loading) return <Loader label="Loading parent dashboard..." />;

  const enrollments = data.enrollments || [];
  const learners = data.linkedLearners || [];
  const batches = data.batches || [];
  const averageProgress = enrollments.length
    ? Math.round(enrollments.reduce((total, item) => total + (item.progress || 0), 0) / enrollments.length)
    : 0;

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
        <StatCard label="Linked Learners" value={learners.length} helper="Children connected to this account" />
        <StatCard label="Active Courses" value={enrollments.length} helper="Current course enrollments" />
        <StatCard label="Batches" value={batches.length} helper="Batch placements and mentors" />
        <StatCard label="Avg Progress" value={`${averageProgress}%`} helper="Across visible enrollments" />
      </div>

      {!learners.length ? (
        <EmptyState title="No learner linked yet" description="Ask the admin to link this parent account with a learner." />
      ) : (
        <div>
          <section className="rounded-[28px] bg-white p-6 shadow-panel">
            <h3 className="font-display text-2xl text-slate-900">Performance Snapshot</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="rounded-3xl border border-slate-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{enrollment.learner?.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{enrollment.course?.title}</p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {enrollment.progress || 0}% complete
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-teal-700" style={{ width: `${enrollment.progress || 0}%` }} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Updated {formatDate(enrollment.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
