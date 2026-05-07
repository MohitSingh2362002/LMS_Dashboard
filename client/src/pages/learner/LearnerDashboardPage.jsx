import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import CourseEnrollModal from "../../components/CourseEnrollModal";
import BrowseCourseCard from "../../components/BrowseCourseCard";
import useFetch from "../../hooks/useFetch";
import { buildLiveClassJoinUrl } from "../../utils/liveClass";
import { useAuth } from "../../context/AuthContext";
import { CourseThumbnail } from "../../components/learner/LearnerPortalUI";

/* ── Icons ───────────────────────────────────────────────────────────── */
const IcBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const IcUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IcTest = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const IcHistory = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
  </svg>
);
const IcDoubt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IcLeader = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <polyline points="18 20 18 10" /><polyline points="12 20 12 4" /><polyline points="6 20 6 14" />
  </svg>
);
const IcCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcVideo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IcStar = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-yellow-400">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Stat Card ───────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, accent = "blue" }) => {
  const bg = {
    blue: "bg-blue-50 text-brand-primary",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  }[accent];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold text-brand-ink">{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
    </div>
  );
};

/* ── Quick Tile ──────────────────────────────────────────────────────── */
const QuickTile = ({ icon, label, sub, to, accent = "blue" }) => {
  const colors = {
    blue: { bg: "bg-brand-surface", icon: "text-brand-primary", border: "border-brand-primary/20" },
    green: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
  }[accent];
  return (
    <Link
      to={to}
      className={`group flex flex-col items-center gap-3 rounded-2xl border ${colors.border} ${colors.bg} p-5 text-center transition hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ${colors.icon}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-brand-ink">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
      </div>
    </Link>
  );
};

/* ── Schedule Item ───────────────────────────────────────────────────── */
const ScheduleItem = ({ item, user }) => {
  const d = new Date(item.date);
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const pill =
    item.type === "class"
      ? "bg-brand-surface text-brand-primary"
      : "bg-amber-50 text-amber-700";
  const pillLabel = item.type === "class" ? "Live Class" : "Mock Test";

  const content = (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md hover:border-brand-primary/30">
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
        <span className="text-[10px] font-bold uppercase text-brand-primary">{month}</span>
        <span className="text-lg font-extrabold text-brand-ink leading-none">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{item.title}</p>
        <p className="text-[11px] text-slate-500">{time} · {item.meta}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${pill}`}>{pillLabel}</span>
    </div>
  );

  if (item.liveClass?.status === "live") {
    return (
      <button className="block w-full text-left" onClick={() => window.open(buildLiveClassJoinUrl(item.liveClass, user), "_blank", "noopener,noreferrer")}>
        {content}
      </button>
    );
  }
  if (item.to) return <Link to={item.to}>{content}</Link>;
  return content;
};

/* ── Main Page ───────────────────────────────────────────────────────── */
const LearnerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollTarget, setEnrollTarget] = useState(null);
  const { data: enrollments, loading, refresh } = useFetch(() => api.get("/enrollments/mine"), []);
  const { data: courses } = useFetch(() => api.get("/courses"), []);
  const { data: liveClasses, refresh: refreshLive } = useFetch(() => api.get("/live-classes"), []);
  const { data: tests } = useFetch(() => api.get("/exam/tests"), []);
  const { data: attempts } = useFetch(() => api.get("/exam/attempts/mine"), []);
  const { data: lbData } = useFetch(() => api.get("/analytics/leaderboard?limit=5&days=30"), []);
  const { data: announcements } = useFetch(() => api.get("/announcements"), []);

  useEffect(() => {
    const id = window.setInterval(refreshLive, 30_000);
    return () => window.clearInterval(id);
  }, [refreshLive]);

  const stats = useMemo(() => {
    const avg = enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
      : 0;
    return {
      enrolled: enrollments.length,
      completed: enrollments.filter((e) => e.progress >= 100).length,
      progress: avg,
    };
  }, [enrollments]);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.course?._id)), [enrollments]);
  const recommended = useMemo(
    () => courses.filter((c) => c.status === "published" && !enrolledIds.has(c._id)).slice(0, 3),
    [courses, enrolledIds]
  );

  const liveClass = liveClasses.find((c) => c.status === "live");

  const schedule = useMemo(() => {
    const live = liveClasses.slice(0, 4).map((c) => ({
      id: `live-${c._id}`, title: c.title,
      meta: c.course?.title || "Live class",
      date: c.scheduledAt || c.startsAt || c.createdAt,
      type: "class", liveClass: c,
    }));
    const testItems = tests.slice(0, 4).map((t) => ({
      id: `test-${t._id}`, title: t.title,
      meta: `${t.durationMinutes ?? "?"} min · ${t.questions?.length || 0} Qs`,
      date: t.startsAt || t.updatedAt,
      type: "test", to: `/learner/exam/tests/${t._id}`,
    }));
    return [...live, ...testItems]
      .filter((i) => i.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [liveClasses, tests]);

  const leaderboard = lbData?.leaderboard || [];

  const enrollFn = async (courseId) => {
    await api.post("/enrollments", { courseId });
  };

  const handleEnrolled = async (courseId) => {
    await refresh();
    // navigate to that course
    const { data: fresh } = await api.get("/enrollments/mine");
    const enrollment = fresh.find((e) => String(e.course?._id || e.course) === String(courseId));
    if (enrollment) navigate(`/learner/courses/${enrollment._id}`);
  };

  if (loading) return <Loader variant="skeleton" label="Loading dashboard…" />;

  const firstName = user?.name?.split(" ")[0] || "Learner";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-7 pb-8">

      {/* Enroll modal */}
      {enrollTarget && (
        <CourseEnrollModal
          course={enrollTarget}
          role="learner"
          onClose={() => setEnrollTarget(null)}
          onEnrolled={handleEnrolled}
          enrollFn={enrollFn}
        />
      )}

      {/* ── Welcome Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary via-brand-accent to-[#1A6FD0] px-7 py-6 text-white shadow-panel">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{greeting},</p>
            <h1 className="text-2xl font-extrabold">{firstName} 👋</h1>
            <p className="mt-1 text-sm text-white/70">
              {stats.enrolled} course{stats.enrolled !== 1 ? "s" : ""} enrolled · {stats.completed} completed
            </p>
          </div>
          {liveClass ? (
            <button
              onClick={() => window.open(buildLiveClassJoinUrl(liveClass, user), "_blank", "noopener,noreferrer")}
              className="flex items-center gap-3 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold backdrop-blur-sm border border-white/20 hover:bg-white/25 transition"
            >
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              Live Now · {liveClass.title}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 ml-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm text-white/60 border border-white/10">
              <IcVideo />
              No live class right now
            </div>
          )}
        </div>
      </div>

      {/* ── Announcements strip ── */}
      {announcements.length > 0 && (
        <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <span className="shrink-0 text-lg">📢</span>
          <p className="flex-1 truncate text-sm font-medium text-amber-800">
            <span className="font-bold">{announcements[0].title}: </span>
            {announcements[0].message}
          </p>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<IcBook />} label="Enrolled" value={String(stats.enrolled).padStart(2, "0")} sub="Active courses" accent="blue" />
        <StatCard icon={<IcCheck />} label="Completed" value={String(stats.completed).padStart(2, "0")} sub="Finished courses" accent="green" />
        <StatCard icon={<IcTrend />} label="Avg Progress" value={`${stats.progress}%`} sub="Overall completion" accent="amber" />
        <StatCard icon={<IcTest />} label="Tests Taken" value={String(attempts.length).padStart(2, "0")} sub="Mock test attempts" accent="purple" />
      </div>

      {/* ── Study Zone ── */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-ink">Study Zone</h2>
            <p className="text-xs text-slate-500">Quick access to your academic tools</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickTile icon={<IcUsers />} label="My Batches" sub="View your batches" to="/learner/batches" accent="blue" />
          <QuickTile icon={<IcTest />} label="Mock Tests" sub="Test series & exams" to="/learner/exam" accent="amber" />
          <QuickTile icon={<IcHistory />} label="Test History" sub="Past results" to={attempts[0] ? `/learner/exam/results/${attempts[0]._id}` : "/learner/exam"} accent="green" />
          <QuickTile icon={<IcDoubt />} label="Doubt Vault" sub="Ask your mentor" to="/learner/doubts" accent="purple" />
        </div>
      </section>

      {/* ── Recommended Courses ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-ink">Recommended Courses</h2>
            <p className="text-xs text-slate-500">Curated published courses — not yet enrolled</p>
          </div>
          <Link
            to="/learner/all-courses"
            className="flex items-center gap-1 rounded-xl border border-brand-primary/30 bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary hover:text-white transition"
          >
            View All →
          </Link>
        </div>

        {recommended.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recommended.map((course) => (
              <BrowseCourseCard
                key={course._id}
                course={course}
                isEnrolled={false}
                onEnrollClick={setEnrollTarget}
              />
            ))}
          </div>
        ) : enrollments.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.slice(0, 3).map((e) => (
              <EnrolledCard key={e._id} enrollment={e} />
            ))}
          </div>
        ) : (
          <EmptyState title="No courses available" description="Recommended courses will appear here when published." />
        )}
      </section>

      {/* ── Schedule + Leaderboard ── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">

        {/* Weekly Schedule */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-brand-ink">Weekly Schedule</h2>
              <p className="text-xs text-slate-500">Upcoming classes and tests</p>
            </div>
            <Link to="/learner/attendance" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-surface transition">
              Full Calendar
            </Link>
          </div>
          {schedule.length ? (
            <div className="space-y-3">
              {schedule.map((item) => <ScheduleItem key={item.id} item={item} user={user} />)}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 py-10 text-center">
              <IcCalendar />
              <p className="mt-2 text-sm text-slate-500">No upcoming sessions</p>
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="rounded-2xl bg-brand-ink p-6 text-white shadow-panel">
          <div className="mb-1 flex items-center gap-2">
            <IcLeader />
            <h2 className="text-base font-extrabold">Leaderboard</h2>
          </div>
          <p className="mb-5 text-xs text-white/50">Top performers this month</p>
          {leaderboard.length ? (
            <div className="space-y-2.5">
              {leaderboard.slice(0, 5).map((item, i) => {
                const isMe = item.email === user?.email;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={item.learner || item.email}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition ${isMe ? "bg-brand-primary" : "bg-white/8 hover:bg-white/12"
                      }`}
                  >
                    <span className="w-6 text-center text-sm font-bold">
                      {medals[i] ?? <span className="text-white/50">{i + 1}</span>}
                    </span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                      {(item.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <p className="flex-1 truncate text-sm font-semibold">
                      {isMe ? `${item.name} (You)` : item.name}
                    </p>
                    <span className="text-sm font-bold text-yellow-300">
                      {item.avgScore ?? item.accuracy ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-white/10 p-4 text-center text-xs text-white/60">
              Leaderboard populates after test attempts.
            </p>
          )}
          <Link
            to="/learner/exam/leaderboards"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
          >
            View All Rankings →
          </Link>
        </section>
      </div>
    </div>
  );
};

/* RecommendedCard replaced by BrowseCourseCard (imported from components) */

/* ── Enrolled Batch Card ─────────────────────────────────────────────── */
const EnrolledCard = ({ enrollment }) => {
  const course = enrollment.course;
  const pct = Math.min(100, enrollment.progress || 0);
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card hover:shadow-cardHover transition-shadow">
      <div className="relative h-44">
        <CourseThumbnail
          title={course?.title}
          thumbnail={course?.thumbnail}
          className="h-full"
          zoom
        />
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 text-sm font-extrabold text-brand-ink leading-snug">{course?.title || "Course"}</h3>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-slate-500">
            <span>Progress</span><span className="font-bold text-brand-primary">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link
          to={`/learner/courses/${enrollment._id}`}
          className="mt-4 block rounded-xl bg-brand-primary py-2 text-center text-xs font-bold text-white hover:bg-brand-ink transition"
        >
          Continue Learning →
        </Link>
      </div>
    </article>
  );
};

export default LearnerDashboardPage;
