import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import BrowseCourseCard from "../../components/BrowseCourseCard";
import CourseEnrollModal from "../../components/CourseEnrollModal";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const ParentCoursesPage = () => {
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState("all");
  const [patternFilter, setPatternFilter] = useState("all");
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());

  const { data: dashData, loading: ld } = useFetch(() => api.get("/parent/dashboard"), []);
  const { data: courses, loading: lc } = useFetch(() => api.get("/courses"), []);

  const linkedLearners = useMemo(() => dashData?.linkedLearners || [], [dashData]);

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

  // Parent enroll function: enrolls linked learner in course
  const enrollFn = async (courseId, learnerId) => {
    if (!learnerId) {
      toast.error("Please select a learner");
      throw new Error("No learner selected");
    }
    await api.post("/enrollments/parent-enroll", { courseId, learnerId });
  };

  const handleEnrolled = (courseId) => {
    setEnrolledCourseIds((prev) => new Set([...prev, String(courseId)]));
    toast.success("Your child has been enrolled in this course!");
  };

  if (ld || lc) return <Loader variant="skeleton" label="Loading courses…" />;

  const freeCount = publishedCourses.filter((c) => c.pricing?.type === "free" || !(c.pricing?.amount > 0)).length;
  const paidCount = publishedCourses.length - freeCount;

  return (
    <div className="space-y-6 pb-8">

      {/* Enroll modal */}
      {enrollTarget && (
        <CourseEnrollModal
          course={enrollTarget}
          role="parent"
          linkedLearners={linkedLearners}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={handleEnrolled}
          enrollFn={enrollFn}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">All Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse all published courses · Enroll your child in free or paid courses.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Free Courses", val: freeCount,  cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Paid Courses", val: paidCount,  cls: "text-violet-600 bg-violet-50 border-violet-200" },
            { label: "My Children",  val: linkedLearners.length, cls: "text-teal-600 bg-teal-50 border-teal-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-4 py-2 text-center ${s.cls}`}>
              <p className="text-lg font-extrabold">{s.val}</p>
              <p className="text-[10px] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Linked learners banner */}
      {linkedLearners.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3">
          <span className="shrink-0 text-lg">👨‍👩‍👧</span>
          <p className="flex-1 text-sm text-teal-800 font-medium">
            Enrolling for:
          </p>
          <div className="flex flex-wrap gap-2">
            {linkedLearners.map((l) => (
              <span key={l._id} className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                {l.name}
              </span>
            ))}
          </div>
        </div>
      )}

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
              placeholder="Search courses by title or instructor…"
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

      {/* Course grid */}
      {!filtered.length ? (
        <EmptyState title="No courses found" description="Try adjusting your filters." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <BrowseCourseCard
              key={course._id}
              course={course}
              isEnrolled={enrolledCourseIds.has(String(course._id))}
              enrolledLabel="Enrolled ✓"
              onEnrollClick={setEnrollTarget}
            />
          ))}
        </div>
      )}

      {!linkedLearners.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-semibold text-amber-700">No linked learners found.</p>
          <p className="text-xs text-amber-600 mt-1">Ask your admin to link your child's account to enable enrollment.</p>
        </div>
      )}
    </div>
  );
};

export default ParentCoursesPage;
