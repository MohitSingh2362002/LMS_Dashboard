import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import DoughnutChart from "../../components/charts/DoughnutChart";
import LineChart from "../../components/charts/LineChart";
import EmptyState from "../../components/EmptyState";

const AdminAnalyticsPage = () => {
  const { data, loading } = useFetch(() => api.get("/analytics/admin"), []);

  if (loading) return <Loader variant="skeleton" label="Loading analytics..." />;

  if (!data || !data.summary) {
    return <EmptyState title="No analytics data" description="Analytics will populate once there is activity in the system." icon="📊" />;
  }

  const { summary, courseCompletion, scoreBuckets, enrollmentTrend, roleCounts, batchGroups, totalRevenue, attendanceRate, totalSessions, doubtStats } = data;

  const trendLabels = (enrollmentTrend || []).map((t) => t.date?.slice(5) || "");
  const trendValues = (enrollmentTrend || []).map((t) => t.count || 0);

  const completionCourses = (courseCompletion || []).filter((c) => c.total > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Analytics</p>
        <h2 className="font-display text-3xl text-slate-900">Deep-Dive Analytics</h2>
        <p className="mt-2 text-sm text-slate-500">Course completion rates, exam performance, enrollment trends, and system health metrics.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={summary.totalUsers} helper="All registered accounts" icon="👤" accentColor="teal" />
        <StatCard label="Total Enrollments" value={summary.totalEnrollments} helper="Across all courses" icon="📖" accentColor="indigo" />
        <StatCard label="Avg Test Score" value={`${summary.avgScore}%`} helper={`${summary.totalAttempts} total attempts`} icon="🏆" accentColor="amber" />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} helper={`${totalSessions} sessions recorded`} icon="✅" accentColor="teal" />
      </div>

      {totalRevenue > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} helper="From paid course enrollments" icon="💰" accentColor="teal" />
          <StatCard label="Doubt Resolution" value={`${doubtStats?.answered || 0}/${doubtStats?.total || 0}`} helper={`${doubtStats?.pending || 0} pending`} icon="💬" accentColor="rose" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Enrollment Trend" subtitle="New enrollments per day (last 30 days)">
          <LineChart labels={trendLabels} datasets={[{ label: "Enrollments", data: trendValues }]} height={280} />
        </ChartCard>

        <ChartCard title="User Role Distribution">
          <DoughnutChart
            labels={["Admins", "Instructors", "Learners", "Parents"]}
            data={[roleCounts?.admin || 0, roleCounts?.instructor || 0, roleCounts?.learner || 0, roleCounts?.parent || 0]}
            centerLabel={`${summary.totalUsers}`}
            height={280}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Course Completion Rates" subtitle="Percentage of enrolled learners who completed each course">
          {completionCourses.length ? (
            <BarChart
              labels={completionCourses.map((c) => c.title.length > 20 ? c.title.slice(0, 20) + "…" : c.title)}
              datasets={[
                { label: "Completion %", data: completionCourses.map((c) => c.rate), backgroundColor: "rgba(15, 118, 110, 0.85)" },
              ]}
              height={280}
            />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No enrollment data to display.</p>
          )}
        </ChartCard>

        <ChartCard title="Exam Score Distribution" subtitle="How test-takers scored across all mock tests">
          <BarChart
            labels={Object.keys(scoreBuckets || {})}
            datasets={[
              {
                label: "Students",
                data: Object.values(scoreBuckets || {}),
                backgroundColor: [
                  "rgba(225, 29, 72, 0.8)",
                  "rgba(245, 158, 11, 0.8)",
                  "rgba(217, 119, 6, 0.8)",
                  "rgba(15, 118, 110, 0.8)",
                  "rgba(5, 150, 105, 0.8)",
                ],
              },
            ]}
            height={280}
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Batch Performance Groups" subtitle="Active batches by tier">
          <BarChart
            labels={Object.keys(batchGroups || {}).map((g) => g.charAt(0).toUpperCase() + g.slice(1))}
            datasets={[{ label: "Active Batches", data: Object.values(batchGroups || {}) }]}
            height={240}
          />
        </ChartCard>

        <ChartCard title="System Summary">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-teal-50 p-4 text-center">
              <p className="font-display text-3xl text-teal-800">{summary.totalCourses}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-teal-600">Courses</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4 text-center">
              <p className="font-display text-3xl text-indigo-800">{summary.totalBatches}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-indigo-600">Active Batches</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-center">
              <p className="font-display text-3xl text-amber-800">{summary.totalTests}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-amber-600">Mock Tests</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 text-center">
              <p className="font-display text-3xl text-rose-800">{doubtStats?.pending || 0}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-rose-600">Pending Doubts</p>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
