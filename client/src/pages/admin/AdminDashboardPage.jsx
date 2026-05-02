import { useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DoughnutChart from "../../components/charts/DoughnutChart";
import LineChart from "../../components/charts/LineChart";
import { formatDate } from "../../utils/helpers";

const AdminDashboardPage = () => {
  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: loadingUsers } = useFetch(() => api.get("/users"), []);
  const { data: reviews, loading: loadingReviews } = useFetch(() => api.get("/reviews"), []);
  const { data: questions, loading: loadingQuestions } = useFetch(() => api.get("/questions"), []);
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);
  const { data: migrations, loading: loadingMigrations } = useFetch(() => api.get("/batches/migrations"), []);
  const { data: analytics, loading: loadingAnalytics } = useFetch(() => api.get("/analytics/admin"), []);

  const stats = useMemo(() => {
    const roleCounts = users.reduce
      ? users.reduce((counts, user) => ({ ...counts, [user.role]: (counts[user.role] || 0) + 1 }), {})
      : {};
    const pendingMigrations = Array.isArray(migrations) ? migrations.filter((item) => item.status === "pending").length : 0;

    return {
      courses: Array.isArray(courses) ? courses.length : 0,
      activeBatches: Array.isArray(batches) ? batches.filter((batch) => batch.status === "active").length : 0,
      learners: roleCounts.learner || 0,
      parents: roleCounts.parent || 0,
      instructors: roleCounts.instructor || 0,
      pendingMigrations,
      unansweredQuestions: Array.isArray(questions) ? questions.filter((item) => !item.isAnswered).length : 0,
      lowReviews: Array.isArray(reviews) ? reviews.filter((item) => item.rating <= 2).length : 0,
    };
  }, [courses, users, questions, reviews, batches, migrations]);

  const groupCounts = useMemo(
    () =>
      ["foundation", "growth", "merit", "ranker"].map((group) => ({
        group,
        count: Array.isArray(batches) ? batches.filter((batch) => batch.performanceGroup === group && batch.status === "active").length : 0,
      })),
    [batches]
  );

  const roleChartData = useMemo(() => {
    const rc = analytics?.roleCounts || {};
    return {
      labels: ["Admins", "Instructors", "Learners", "Parents"],
      values: [rc.admin || 0, rc.instructor || 0, rc.learner || 0, rc.parent || 0],
    };
  }, [analytics]);

  const enrollmentTrend = useMemo(() => {
    const trend = analytics?.enrollmentTrend || [];
    return {
      labels: trend.map((t) => t.date?.slice(5) || ""),
      values: trend.map((t) => t.count || 0),
    };
  }, [analytics]);

  const isLoading = loadingCourses || loadingUsers || loadingReviews || loadingQuestions || loadingBatches || loadingMigrations;

  if (isLoading && loadingAnalytics) {
    return <Loader variant="skeleton" label="Loading command center..." />;
  }

  const coursesArr = Array.isArray(courses) ? courses : [];
  const migrationsArr = Array.isArray(migrations) ? migrations : [];

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
        <StatCard label="Courses" value={stats.courses} helper="Published and draft courses" icon="📚" accentColor="teal" />
        <StatCard label="Active Batches" value={stats.activeBatches} helper="Learner groups currently running" icon="👥" accentColor="indigo" />
        <StatCard label="Learners" value={stats.learners} helper={`${stats.parents} linked parent accounts`} icon="🎓" accentColor="amber" />
        <StatCard label="Pending Migrations" value={stats.pendingMigrations} helper="Awaiting admin approval" icon="🔄" accentColor="rose" trend={stats.pendingMigrations > 3 ? "up" : "neutral"} />
      </div>

      {analytics?.totalRevenue > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          <StatCard label="Revenue" value={`$${analytics.totalRevenue.toLocaleString()}`} helper={`${analytics.paidEnrollments} paid enrollments`} icon="💰" accentColor="teal" />
          <StatCard label="Avg Test Score" value={`${analytics?.summary?.avgScore || 0}%`} helper={`${analytics?.summary?.totalAttempts || 0} total attempts`} icon="📊" accentColor="amber" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User Role Distribution" subtitle="Breakdown of registered users by role">
          <DoughnutChart
            labels={roleChartData.labels}
            data={roleChartData.values}
            centerLabel={`${analytics?.summary?.totalUsers || users?.length || 0}`}
            height={260}
          />
        </ChartCard>

        <ChartCard title="Enrollment Trend" subtitle="New enrollments over the last 30 days">
          <LineChart
            labels={enrollmentTrend.labels}
            datasets={[{ label: "Enrollments", data: enrollmentTrend.values }]}
            height={260}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Batch Distribution" subtitle="Active batches by performance group">
          <BarChart
            labels={groupCounts.map((item) => item.group.charAt(0).toUpperCase() + item.group.slice(1))}
            datasets={[{ label: "Batches", data: groupCounts.map((item) => item.count) }]}
            height={220}
          />
          <Link to="/admin/batches" className="mt-4 inline-block rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
            Manage Batches
          </Link>
        </ChartCard>

        <ChartCard title="Approval Queue" subtitle="Recent pending migration requests">
          <div className="space-y-4">
            {migrationsArr.filter((item) => item.status === "pending").slice(0, 4).map((request) => (
              <div key={request._id} className="rounded-3xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <p className="font-semibold text-slate-900">{request.learner?.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {request.fromBatch?.name} → {request.toBatch?.name}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            ))}
            {!stats.pendingMigrations ? <p className="text-sm text-slate-500">No pending migration requests.</p> : null}
          </div>
          <Link to="/admin/migrations" className="mt-4 inline-block rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            Review Requests
          </Link>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <ChartCard title="Recent Courses">
          <div className="space-y-4">
            {coursesArr.slice(0, 5).map((course) => (
              <div key={course._id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
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
        </ChartCard>

        <ChartCard title="Quick Pulse">
          <div className="space-y-4">
            <div className="rounded-2xl bg-teal-50 p-4">
              <p className="text-sm font-medium text-teal-800">👨‍🏫 {stats.instructors} instructors available for batch mentoring</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">❓ {stats.unansweredQuestions} unanswered Q&A entries need attention</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">📝 {coursesArr.filter((item) => item.status === "draft").length} courses still in draft</p>
            </div>
            {stats.lowReviews > 0 ? (
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-800">⚠ {stats.lowReviews} low-rating reviews may need follow-up</p>
              </div>
            ) : null}
            {analytics?.doubtStats ? (
              <div className="rounded-2xl bg-indigo-50 p-4">
                <p className="text-sm font-medium text-indigo-800">💬 {analytics.doubtStats.pending} pending doubts out of {analytics.doubtStats.total}</p>
              </div>
            ) : null}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
