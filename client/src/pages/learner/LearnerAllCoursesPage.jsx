import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import BrowseCourseCard from "../../components/BrowseCourseCard";
import CourseEnrollModal from "../../components/CourseEnrollModal";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const LearnerAllCoursesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState("all"); // "all" | "free" | "paid"
  const [patternFilter, setPatternFilter] = useState("all");
  const [enrollTarget, setEnrollTarget] = useState(null); // course to enroll

  const { data: courses, loading: lc } = useFetch(() => api.get("/courses"), []);
  const { data: enrollments, loading: le, refresh: refreshEnrollments } = useFetch(
    () => api.get("/enrollments/mine"), []
  );

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => String(e.course?._id || e.course))),
    [enrollments]
  );

  const publishedCourses = useMemo(
    () => (Array.isArray(courses) ? courses : []).filter((c) => c.status === "published"),
    [courses]
  );

  const patterns = useMemo(
    () => [...new Set(publishedCourses.map((c) => c.examPattern).filter(Boolean))],
    [publishedCourses]
  );

  const filtered = useMemo(() => {
    return publishedCourses.filter((c) => {
      const matchSearch = !search.trim() ||
        `${c.title} ${c.instructorDisplayName || ""} ${c.instructor?.name || ""}`
          .toLowerCase().includes(search.toLowerCase());
      const isFree = c.pricing?.type === "free" || !(c.pricing?.amount > 0);
      const matchPrice =
        pricingFilter === "all" ? true :
        pricingFilter === "free" ? isFree : !isFree;
      const matchPattern = patternFilter === "all" || c.examPattern === patternFilter;
      return matchSearch && matchPrice && matchPattern;
    });
  }, [publishedCourses, search, pricingFilter, patternFilter]);

  const unenrolledCourses = useMemo(
    () => filtered.filter((c) => !enrolledCourseIds.has(String(c._id))),
    [filtered, enrolledCourseIds]
  );
  const enrolledCourses = useMemo(
    () => filtered.filter((c) => enrolledCourseIds.has(String(c._id))),
    [filtered, enrolledCourseIds]
  );

  const enrollFn = async (courseId) => {
    await api.post("/enrollments", { courseId });
  };

  const handleEnrolled = async (courseId) => {
    await refreshEnrollments();
    // Find the enrollment and navigate to it
    const { data: fresh } = await api.get("/enrollments/mine");
    const enrollment = fresh.find((e) => String(e.course?._id || e.course) === String(courseId));
    if (enrollment) navigate(`/learner/courses/${enrollment._id}`);
  };

  const handleContinue = (course) => {
    const enrollment = enrollments.find((e) => String(e.course?._id || e.course) === String(course._id));
    if (enrollment) navigate(`/learner/courses/${enrollment._id}`);
  };

  if (lc || le) return <Loader variant="skeleton" label="Loading courses…" />;

  return (
    <div className="space-y-6 pb-8">

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

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Browse All Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            {publishedCourses.length} published · {enrolledCourseIds.size} enrolled · {unenrolledCourses.length} available
          </p>
        </div>
        {/* Stats */}
        <div className="flex gap-3">
          {[
            { label: "Enrolled",   val: enrolledCourseIds.size,    cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Available",  val: publishedCourses.length - enrolledCourseIds.size, cls: "text-brand-primary bg-brand-surface border-brand-primary/20" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-4 py-2 text-center ${s.cls}`}>
              <p className="text-lg font-extrabold">{s.val}</p>
              <p className="text-[10px] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, instructor…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
            />
          </div>

          {/* Pricing filter */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { key: "all",  label: "All" },
              { key: "free", label: "Free" },
              { key: "paid", label: "Paid" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPricingFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  pricingFilter === key ? "bg-white text-brand-primary shadow-sm" : "text-slate-500 hover:text-brand-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Pattern filter */}
          {patterns.length > 0 && (
            <select
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 focus:border-brand-primary focus:outline-none"
            >
              <option value="all">All Patterns</option>
              {patterns.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          {(search || pricingFilter !== "all" || patternFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setPricingFilter("all"); setPatternFilter("all"); }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:border-brand-primary hover:text-brand-primary transition"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Showing <span className="font-bold text-brand-primary">{filtered.length}</span> of {publishedCourses.length} courses
        </p>
      </div>

      {/* Not yet enrolled */}
      {unenrolledCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-extrabold text-brand-ink">
            Available for Enrollment
            <span className="ml-2 rounded-full bg-brand-surface px-2.5 py-0.5 text-xs font-bold text-brand-primary">{unenrolledCourses.length}</span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unenrolledCourses.map((course) => (
              <BrowseCourseCard
                key={course._id}
                course={course}
                isEnrolled={false}
                onEnrollClick={setEnrollTarget}
              />
            ))}
          </div>
        </section>
      )}

      {/* Already enrolled */}
      {enrolledCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-extrabold text-brand-ink">
            Already Enrolled
            <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{enrolledCourses.length}</span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {enrolledCourses.map((course) => (
              <BrowseCourseCard
                key={course._id}
                course={course}
                isEnrolled={true}
                enrolledLabel="Continue →"
                onEnrollClick={() => {}}
                onContinue={handleContinue}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {!filtered.length && (
        <EmptyState
          title="No courses found"
          description="Try adjusting your filters or check back later for new courses."
        />
      )}
    </div>
  );
};

export default LearnerAllCoursesPage;
