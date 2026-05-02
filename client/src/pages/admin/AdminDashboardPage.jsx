import { useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import { formatDate } from "../../utils/helpers";

const AdminDashboardPage = () => {
  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: loadingUsers } = useFetch(() => api.get("/users"), []);
  const { data: reviews, loading: loadingReviews } = useFetch(() => api.get("/reviews"), []);
  const { data: questions, loading: loadingQuestions } = useFetch(() => api.get("/questions"), []);
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);
  const { data: migrations, loading: loadingMigrations } = useFetch(() => api.get("/batches/migrations"), []);

  const stats = useMemo(() => {
    const roleCounts = users.reduce(
      (counts, user) => ({ ...counts, [user.role]: (counts[user.role] || 0) + 1 }),
      {}
    );
    const pendingMigrations = migrations.filter((item) => item.status === "pending").length;

    return {
      courses: courses.length,
      activeBatches: batches.filter((batch) => batch.status === "active").length,
      learners: roleCounts.learner || 0,
      parents: roleCounts.parent || 0,
      instructors: roleCounts.instructor || 0,
      pendingMigrations,
      unansweredQuestions: questions.filter((item) => !item.isAnswered).length,
      lowReviews: reviews.filter((item) => item.rating <= 2).length
    };
  }, [courses, users, questions, reviews, batches, migrations]);

  const groupCounts = useMemo(
    () =>
      ["foundation", "growth", "merit", "ranker"].map((group) => ({
        group,
        count: batches.filter((batch) => batch.performanceGroup === group && batch.status === "active").length
      })),
    [batches]
  );

  if (loadingCourses || loadingUsers || loadingReviews || loadingQuestions || loadingBatches || loadingMigrations) {
    return <Loader label="Loading command center..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Command Center</p>
        <h2 className="font-display text-3xl text-slate-900">Operations Overview</h2>
        <p className="mt-2 text-sm text-slate-500">
          Track academic structure, user roles, batch health, and approval queues.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={stats.courses} helper="Published and draft courses" />
        <StatCard label="Active Batches" value={stats.activeBatches} helper="Learner groups currently running" />
        <StatCard label="Learners" value={stats.learners} helper={`${stats.parents} linked parent accounts`} />
        <StatCard label="Pending Migrations" value={stats.pendingMigrations} helper="Awaiting admin approval" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl">Batch Distribution</h3>
            <Link to="/admin/batches" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
              Manage Batches
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {groupCounts.map((item) => (
              <div key={item.group} className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.group}</p>
                <p className="mt-2 font-display text-3xl text-slate-900">{item.count}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl">Approval Queue</h3>
            <Link to="/admin/migrations" className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
              Review Requests
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {migrations.filter((item) => item.status === "pending").slice(0, 4).map((request) => (
              <div key={request._id} className="rounded-3xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{request.learner?.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {request.fromBatch?.name} to {request.toBatch?.name}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            ))}
            {!stats.pendingMigrations ? <p className="text-sm text-slate-500">No pending migration requests.</p> : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Recent Courses</h3>
          <div className="mt-4 space-y-4">
            {courses.slice(0, 5).map((course) => (
              <div key={course._id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm text-slate-500">{course.instructorDisplayName || course.instructor?.name || "Unassigned"}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {course.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Quick Pulse</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <p>{stats.instructors} instructors are available for batch mentoring.</p>
            <p>{stats.unansweredQuestions} unanswered Q&A entries need attention.</p>
            <p>{courses.filter((item) => item.status === "draft").length} courses are still in draft.</p>
            <p>{stats.lowReviews} low-rating reviews may need follow-up.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
