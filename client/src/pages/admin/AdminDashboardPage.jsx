import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { formatDate } from "../../utils/helpers";

const StatPill = ({ label, value, delta, deltaTone = "up", icon }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
    <div className="flex items-start justify-between">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface text-brand-primary">
        {icon}
      </div>
    </div>
    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-brand-ink">{value}</p>
    {delta ? (
      <p className={`mt-1 text-[11px] font-medium ${deltaTone === "up" ? "text-emerald-600" : deltaTone === "down" ? "text-rose-600" : "text-slate-500"}`}>
        {deltaTone === "up" ? "▲ " : deltaTone === "down" ? "▼ " : ""}{delta}
      </p>
    ) : null}
  </div>
);

const PulseItem = ({ tone, title, body }) => {
  const tones = {
    danger: "border-l-rose-500 bg-rose-50/60",
    info: "border-l-brand-accent bg-brand-surface/50",
    success: "border-l-emerald-500 bg-emerald-50/60"
  };
  const dot = {
    danger: "bg-rose-500",
    info: "bg-brand-accent",
    success: "bg-emerald-500"
  };
  return (
    <div className={`rounded-lg border-l-4 p-3 ${tones[tone]}`}>
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot[tone]}`} />
        <div>
          <p className="text-sm font-semibold text-brand-ink">{title}</p>
          <p className="mt-0.5 text-xs text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
};

// Bar chart with Y-axis gridlines, value labels above each bar, and X-axis labels
const BarChart = ({ data, accent = "#2E7FD9", unit = "" }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const isEmpty = data.every((d) => d.value === 0);
  const H = 160; // chart bar area height in px
  const Y_FRACS = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="select-none">
      {/* Chart area with Y-axis */}
      <div className="relative" style={{ marginLeft: 36, marginBottom: 28, height: H }}>
        {/* Gridlines + Y-axis value labels */}
        {Y_FRACS.map((f) => (
          <div key={f}>
            <div
              className="absolute right-0 border-t border-dashed border-slate-100"
              style={{ left: 0, bottom: `${f * H}px` }}
            />
            <span
              className="absolute text-[9px] leading-none text-slate-400"
              style={{ right: "calc(100% + 4px)", bottom: `${f * H - 5}px`, whiteSpace: "nowrap" }}
            >
              {Math.round(max * f)}{unit}
            </span>
          </div>
        ))}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end gap-3">
          {data.map((d, i) => {
            const barH = isEmpty ? 2 : Math.max((d.value / max) * H, d.value > 0 ? 6 : 0);
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end" style={{ height: H }}>
                <span className="mb-1.5 text-xs font-bold text-slate-700 leading-none">
                  {d.value > 0 ? `${d.value}${unit}` : isEmpty ? "" : "0"}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-700"
                  style={{
                    height: barH,
                    background: isEmpty
                      ? "#E2E8F0"
                      : `linear-gradient(180deg, ${accent} 0%, ${accent}bb 100%)`
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex gap-3" style={{ marginLeft: 36 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[11px] font-medium text-slate-500">{d.label}</div>
        ))}
      </div>

      {isEmpty && (
        <p className="mt-2 text-center text-xs text-slate-400">No enrollment data for this period</p>
      )}
    </div>
  );
};

// Attendance bar chart — color-coded by rate, percentage shown above each bar
const AttendanceBarChart = ({ data }) => {
  const isEmpty = data.every((d) => d.value === 0);
  const H = 110;

  const barColor = (v) => {
    if (v >= 80) return "#10B981";
    if (v >= 60) return "#F59E0B";
    return "#EF4444";
  };
  const textColor = (v) => {
    if (v >= 80) return "text-emerald-600";
    if (v >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="select-none flex gap-2 items-end" style={{ height: H + 44 }}>
      {data.map((d, i) => {
        const barH = isEmpty ? 3 : Math.max((d.value / 100) * H, d.value > 0 ? 6 : 3);
        return (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-0.5" style={{ height: H + 24 }}>
            {/* Percentage value */}
            <span className={`text-[10px] font-extrabold leading-none ${d.value > 0 ? textColor(d.value) : "text-slate-300"}`}>
              {d.value > 0 ? `${d.value}%` : "—"}
            </span>
            {/* Bar */}
            <div
              className="w-full rounded-t-md transition-all duration-500"
              style={{
                height: barH,
                backgroundColor: isEmpty || d.value === 0 ? "#E2E8F0" : barColor(d.value)
              }}
            />
            {/* Day label */}
            <span className="mt-1 text-[11px] font-medium text-slate-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const HBar = ({ label, value, total, color = "#1A4FA0" }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-brand-ink">{label}</span>
        <span className="font-semibold text-slate-500">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [thisMonth, setThisMonth] = useState(false);

  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: loadingUsers } = useFetch(() => api.get("/users"), []);
  const { data: reviews } = useFetch(() => api.get("/reviews"), []);
  const { data: questions } = useFetch(() => api.get("/questions"), []);
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);
  const { data: migrations, loading: loadingMigrations } = useFetch(() => api.get("/batches/migrations"), []);
  const { data: analytics, loading: loadingAnalytics } = useFetch(() => api.get("/analytics/admin"), []);
  const { data: weeklyAttendance } = useFetch(() => api.get("/analytics/weekly-attendance"), []);

  const stats = useMemo(() => {
    const arr = Array.isArray(users) ? users : [];
    const roleCounts = arr.reduce((c, u) => ({ ...c, [u.role]: (c[u.role] || 0) + 1 }), {});
    const pendingMigrations = Array.isArray(migrations) ? migrations.filter((i) => i.status === "pending").length : 0;
    return {
      courses: Array.isArray(courses) ? courses.length : 0,
      activeBatches: Array.isArray(batches) ? batches.filter((b) => b.status === "active").length : 0,
      learners: roleCounts.learner || 0,
      parents: roleCounts.parent || 0,
      instructors: roleCounts.instructor || 0,
      admins: roleCounts.admin || 0,
      staff: (roleCounts.instructor || 0),
      pendingMigrations,
      unansweredQuestions: Array.isArray(questions) ? questions.filter((i) => !i.isAnswered).length : 0,
      lowReviews: Array.isArray(reviews) ? reviews.filter((i) => i.rating <= 2).length : 0
    };
  }, [courses, users, questions, reviews, batches, migrations]);

  const enrollmentTrend = useMemo(() => {
    const allTrend = analytics?.enrollmentTrend || [];
    if (thisMonth) {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const monthData = allTrend.filter((t) => t.date?.startsWith(monthStr));
      // Aggregate 30-day data into 4 weekly buckets
      const weeks = [0, 0, 0, 0];
      monthData.forEach((t, i) => { weeks[Math.min(Math.floor(i / 7), 3)] += t.count || 0; });
      return weeks.map((v, i) => ({ label: `Wk ${i + 1}`, value: v }));
    }
    // Group 30-day entries into 4 rolling weeks (most recent last)
    const days = allTrend.slice(-28); // last 28 days
    const weeks = [0, 0, 0, 0];
    days.forEach((t, i) => { weeks[Math.floor(i / 7)] += t.count || 0; });
    return weeks.map((v, i) => ({ label: `Wk ${i + 1}`, value: v }));
  }, [analytics, thisMonth]);

  const enrollmentCountByCourse = analytics?.enrollmentCountByCourse || {};

  // Build a map from course title → completion stats
  const completionByTitle = useMemo(() => {
    const map = {};
    (analytics?.courseCompletion || []).forEach((c) => { map[c.title] = c; });
    return map;
  }, [analytics]);

  const isLoading = loadingCourses || loadingUsers || loadingBatches || loadingMigrations;
  if (isLoading && loadingAnalytics) return <Loader variant="skeleton" label="Loading dashboard..." />;

  const coursesArr = Array.isArray(courses) ? courses : [];
  const totalUsers = stats.learners + stats.parents + stats.instructors + stats.admins || 1;
  const totalBatches = Array.isArray(batches) ? batches.length : 0;
  const groupCounts = ["foundation", "growth", "merit"].map((g) => ({
    group: g,
    count: Array.isArray(batches) ? batches.filter((b) => b.performanceGroup === g).length : 0
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Operations Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Comprehensive Insights for EduAdmin Academic Year 2024-25</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setThisMonth((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${thisMonth ? "border-brand-accent bg-brand-surface text-brand-primary" : "border-slate-200 bg-white text-brand-ink hover:bg-slate-50"}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            {thisMonth ? "This Month ✓" : "This Month"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white hover:brightness-95">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatPill label="Total Courses" value={stats.courses.toLocaleString()} delta="10% Increase" deltaTone="up"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>} />
        <StatPill label="Active Learners" value={stats.learners.toLocaleString()} delta="8.4% growth" deltaTone="up"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M22 10v6M2 10l10-5 10 5-10 5L2 10z" /></svg>} />
        <StatPill label="Instructors" value={stats.instructors.toLocaleString()} delta="Stable" deltaTone="neutral"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" /></svg>} />
        <StatPill label="Active Batches" value={stats.activeBatches.toLocaleString()} delta="5 new added" deltaTone="up"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 3l9 4-9 4-9-4 9-4zM3 11l9 4 9-4M3 15l9 4 9-4" /></svg>} />
        <StatPill
          label="Revenue"
          value={analytics != null
            ? (analytics.totalRevenue >= 1_000_000
              ? `$${(analytics.totalRevenue / 1_000_000).toFixed(1)}M`
              : analytics.totalRevenue >= 1_000
              ? `$${(analytics.totalRevenue / 1_000).toFixed(0)}K`
              : `$${analytics.totalRevenue}`)
            : "—"}
          delta={analytics != null && analytics.paidEnrollments > 0 ? `${analytics.paidEnrollments} paid enroll.` : "No paid courses"}
          deltaTone={analytics?.paidEnrollments > 0 ? "up" : "neutral"}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>} />
        <div className="rounded-2xl bg-brand-ink p-4 text-white shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-white/60">Pending Actions</p>
          <p className="mt-1 text-2xl font-bold">{stats.pendingMigrations}</p>
          <p className="mt-1 text-[11px] font-medium text-brand-cta">Review Required</p>
        </div>
      </div>

      {/* Enrollment chart + Quick Pulse */}
      <div className="grid gap-5 xl:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-brand-ink">
                Enrollment Trend
              </h2>
              <p className="text-[11px] text-slate-500">
                {thisMonth
                  ? `${new Date().toLocaleString("default", { month: "long" })} ${new Date().getFullYear()} — weekly breakdown`
                  : "Last 30 days — weekly breakdown"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#2E7FD9" }} />
                New enrollments
              </span>
            </div>
          </div>

          <BarChart data={enrollmentTrend} accent="#2E7FD9" />

          {/* Summary strip */}
          {(() => {
            const total = enrollmentTrend.reduce((s, d) => s + d.value, 0);
            const peak = enrollmentTrend.reduce((best, d) => d.value > best.value ? d : best, { label: "—", value: 0 });
            return (
              <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Total Enrollments</p>
                  <p className="mt-0.5 text-lg font-bold text-brand-ink">{total}</p>
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Peak Week</p>
                  <p className="mt-0.5 text-lg font-bold text-brand-ink">{peak.label} <span className="text-sm font-medium text-brand-primary">({peak.value})</span></p>
                </div>
                <div className="ml-auto">
                  <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${total > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {total > 0 ? `+${total} this period` : "No data yet"}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-ink">Quick Pulse</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live</span>
          </div>

          <div className="flex-1 space-y-2">
            {/* Unanswered Doubts — highest priority */}
            {stats.unansweredQuestions > 0 && (
              <PulseItem tone="danger" title="Unanswered Doubts"
                body={`${stats.unansweredQuestions} student doubt${stats.unansweredQuestions > 1 ? "s" : ""} in the Doubt Vault need attention.`} />
            )}

            {/* Low star reviews */}
            {stats.lowReviews > 0 && (
              <PulseItem tone="danger" title="Low-Rated Reviews"
                body={`${stats.lowReviews} review${stats.lowReviews > 1 ? "s" : ""} with ≤2 stars — quality check needed.`} />
            )}

            {/* Pending Migrations */}
            {stats.pendingMigrations > 0 && (
              <PulseItem tone="info" title="Pending Migrations"
                body={`${stats.pendingMigrations} batch migration request${stats.pendingMigrations > 1 ? "s" : ""} awaiting review.`} />
            )}

            {/* Attendance alert */}
            {(() => {
              const rate = analytics?.attendanceRate ?? null;
              if (rate !== null && rate < 60) {
                return <PulseItem tone="danger" title="Low Attendance Rate" body={`Overall attendance is ${rate}% — below the 60% threshold. Review sessions.`} />;
              }
              return null;
            })()}

            {/* Enrollment trend — warn if all weeks are 0 */}
            {enrollmentTrend.every((w) => w.value === 0) && (
              <PulseItem tone="info" title="No Recent Enrollments"
                body="Zero enrollments recorded in the last 4 weeks. Consider promotion." />
            )}

            {/* No active batches */}
            {stats.activeBatches === 0 && (
              <PulseItem tone="info" title="No Active Batches"
                body="All batches are archived. Create a new batch to resume operations." />
            )}

            {/* Doubts resolved — success */}
            {analytics?.doubtStats?.answered > 0 && (
              <PulseItem tone="success" title="Doubts Resolved"
                body={`${analytics.doubtStats.answered} of ${analytics.doubtStats.total} doubts resolved (${Math.round((analytics.doubtStats.answered / analytics.doubtStats.total) * 100)}% rate).`} />
            )}

            {/* Good attendance */}
            {analytics?.attendanceRate >= 80 && (
              <PulseItem tone="success" title="Great Attendance"
                body={`Overall attendance is ${analytics.attendanceRate}% — well above target.`} />
            )}

            {/* All clear */}
            {!stats.unansweredQuestions && !stats.lowReviews && !stats.pendingMigrations &&
             !(analytics?.attendanceRate < 60) && !enrollmentTrend.every((w) => w.value === 0) &&
             stats.activeBatches > 0 && (
              <PulseItem tone="success" title="All Systems Clear"
                body="No pending actions or alerts. Everything is running smoothly." />
            )}
          </div>

          {/* Quick action buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => navigate("/admin/doubts")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              Doubts {stats.unansweredQuestions > 0 && <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 text-white text-[9px]">{stats.unansweredQuestions}</span>}
            </button>
            <button onClick={() => navigate("/admin/migrations")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-accent/30 bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-primary hover:bg-brand-surface/70 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              Migrations {stats.pendingMigrations > 0 && <span className="ml-0.5 rounded-full bg-brand-primary px-1.5 text-white text-[9px]">{stats.pendingMigrations}</span>}
            </button>
            <button onClick={() => navigate("/admin/reviews")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Reviews {stats.lowReviews > 0 && <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 text-white text-[9px]">{stats.lowReviews}</span>}
            </button>
            <button onClick={() => navigate("/admin/support")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Three smaller cards */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-brand-ink">User Role Distribution</h3>
          <div className="space-y-3">
            <HBar label="Learners" value={stats.learners} total={totalUsers} color="#1A4FA0" />
            <HBar label="Parents" value={stats.parents} total={totalUsers} color="#2E7FD9" />
            <HBar label="Staff" value={stats.staff} total={totalUsers} color="#F0A500" />
            <HBar label="Admin" value={stats.admins} total={totalUsers} color="#1C1E2B" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-brand-ink">Batch Distribution</h3>
          <div className="space-y-3">
            {groupCounts.map((g) => (
              <div key={g.group} className="flex items-center justify-between">
                <div className="flex-1">
                  <HBar
                    label={`${g.group.charAt(0).toUpperCase()}${g.group.slice(1)}`}
                    value={g.count}
                    total={totalBatches || 1}
                    color={g.group === "foundation" ? "#1A4FA0" : g.group === "growth" ? "#2E7FD9" : "#F0A500"}
                  />
                </div>
                <span className="ml-3 text-xs font-medium text-slate-500">{g.count} Batches</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-ink">Attendance Snapshot</h3>
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" />≥80%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />60–79%</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-400" />&lt;60%</span>
            </div>
          </div>
          {(() => {
            const wa = Array.isArray(weeklyAttendance) && weeklyAttendance.length
              ? weeklyAttendance
              : [
                  { label: "Mon", rate: 0, total: 0 },
                  { label: "Tue", rate: 0, total: 0 },
                  { label: "Wed", rate: 0, total: 0 },
                  { label: "Thu", rate: 0, total: 0 },
                  { label: "Fri", rate: 0, total: 0 }
                ];
            const hasData = wa.some((d) => d.total > 0);
            const withData = wa.filter((d) => d.total > 0);
            const avgRate = withData.length
              ? Math.round(withData.reduce((s, d) => s + (d.rate ?? 0), 0) / withData.length)
              : null;
            return (
              <>
                <AttendanceBarChart
                  data={wa.map((d) => ({ label: d.label.slice(0, 3), value: d.rate ?? 0 }))}
                />
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Avg This Week</p>
                  <div className="flex items-center gap-1.5">
                    {hasData ? (
                      <>
                        <span className={`text-xl font-bold ${avgRate >= 80 ? "text-emerald-600" : avgRate >= 60 ? "text-amber-500" : "text-rose-500"}`}>{avgRate}%</span>
                        <span className="text-[10px] font-medium text-slate-400">attendance</span>
                      </>
                    ) : analytics?.attendanceRate > 0 ? (
                      <>
                        <span className="text-xl font-bold text-brand-ink">{analytics.attendanceRate}%</span>
                        <span className="text-[10px] font-medium text-slate-400">overall</span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No sessions yet</span>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Recent Courses table */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-brand-ink">Recent Courses</h3>
          <Link to="/admin/courses" className="text-xs font-semibold text-brand-primary hover:underline">View Full Catalog</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Course Name</th>
                <th className="px-5 py-3 text-left">Instructor</th>
                <th className="px-5 py-3 text-left">Enrollment</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Progress</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coursesArr.slice(0, 5).map((course) => (
                <tr key={course._id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface text-brand-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                      </div>
                      <div>
                        <p className="font-semibold text-brand-ink">{course.title}</p>
                        <p className="text-[11px] text-slate-500">ID: {course._id?.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{course.instructorDisplayName || course.instructor?.name || "Unassigned"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{enrollmentCountByCourse[course._id] ?? course.enrollmentCount ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${course.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {course.status === "published" ? "Active" : course.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {(() => {
                      const c = completionByTitle[course.title];
                      const pct = c ? c.rate : null;
                      return (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand-accent" style={{ width: pct !== null ? `${pct}%` : "0%" }} />
                          </div>
                          <span className="text-[11px] text-slate-500">{pct !== null ? `${pct}%` : "—"} Complete</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-ink">⋮</button>
                  </td>
                </tr>
              ))}
              {coursesArr.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No courses yet</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* hidden but kept: pending migrations summary */}
      {stats.pendingMigrations > 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-brand-ink">Pending Migrations</h3>
            <Link to="/admin/migrations" className="text-xs font-semibold text-brand-primary hover:underline">Review →</Link>
          </div>
          <div className="space-y-2">
            {(Array.isArray(migrations) ? migrations : []).filter((m) => m.status === "pending").slice(0, 3).map((r) => (
              <div key={r._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="font-medium text-brand-ink">{r.learner?.name}</span>
                <span className="text-slate-500">{r.fromBatch?.name} → {r.toBatch?.name}</span>
                <span className="text-slate-400">{formatDate(r.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
