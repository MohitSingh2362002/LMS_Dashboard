import { useMemo } from "react";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";

const AdminDashboardPage = () => {
  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: loadingUsers } = useFetch(() => api.get("/users"), []);
  const { data: reviews, loading: loadingReviews } = useFetch(() => api.get("/reviews"), []);
  const { data: questions, loading: loadingQuestions } = useFetch(() => api.get("/questions"), []);

  const stats = useMemo(
    () => ({
      courses: courses.length,
      users: users.length,
      questions: questions.length,
      reviews: reviews.length
    }),
    [courses, users, questions, reviews]
  );

  if (loadingCourses || loadingUsers || loadingReviews || loadingQuestions) return <Loader label="Loading admin dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={stats.courses} helper="Published and draft courses in the catalog" />
        <StatCard label="Users" value={stats.users} helper="Active instructors and learners" />
        <StatCard label="Questions" value={stats.questions} helper="Public learner questions received" />
        <StatCard label="Reviews" value={stats.reviews} helper="Review activity across courses" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h2 className="font-display text-2xl">Recent Courses</h2>
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
          <h2 className="font-display text-2xl">Quick Pulse</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <p>{questions.filter((item) => !item.isAnswered).length} unanswered Q&A entries need attention.</p>
            <p>{courses.filter((item) => item.status === "draft").length} courses are still in draft.</p>
            <p>{reviews.filter((item) => item.rating <= 2).length} low-rating reviews may need follow-up.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
