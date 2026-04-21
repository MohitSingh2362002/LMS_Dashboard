import { useMemo } from "react";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import StatCard from "../../components/StatCard";

const InstructorDashboardPage = () => {
  const { data: courses, loading } = useFetch(() => api.get("/courses"), []);

  const totals = useMemo(
    () => ({
      courses: courses.length,
      students: courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0),
      published: courses.filter((course) => course.status === "published").length
    }),
    [courses]
  );

  if (loading) return <Loader label="Loading instructor dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Assigned Courses" value={totals.courses} helper="Courses attached to your account" />
        <StatCard label="Enrollments" value={totals.students} helper="Learners enrolled across your courses" />
        <StatCard label="Published" value={totals.published} helper="Courses live for learners right now" />
      </div>
      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h2 className="font-display text-2xl">My Courses</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div key={course._id} className="rounded-2xl border border-slate-100 p-4">
              <p className="font-semibold">{course.title}</p>
              <p className="mt-2 text-sm text-slate-500">{course.enrollmentCount || 0} enrolled learners</p>
              <p className="mt-1 text-sm text-slate-500">{course.pages?.length || 0} content pages</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default InstructorDashboardPage;
