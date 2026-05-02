import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import Stars from "../../components/Stars";
import StatCard from "../../components/StatCard";
import ChartCard from "../../components/charts/ChartCard";
import BarChart from "../../components/charts/BarChart";
import { downloadCertificate } from "../../utils/certificate";
import { getFullImageUrl, stripHtml, average, getLiveTestStatus } from "../../utils/helpers";
import { buildLiveClassJoinUrl } from "../../utils/liveClass";
import { useAuth } from "../../context/AuthContext";

const LearnerDashboardPage = () => {
  const { user } = useAuth();
  const { data: enrollments, loading, refresh } = useFetch(() => api.get("/enrollments/mine"), []);
  const { data: courses } = useFetch(() => api.get("/courses"), []);
  const { data: liveClasses, refresh: refreshLiveClasses } = useFetch(() => api.get("/live-classes"), []);
  const [question, setQuestion] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");
  const { data: questions, refresh: refreshQuestions } = useFetch(() => api.get("/questions"), []);
  const { data: reviews, refresh: refreshReviews } = useFetch(() => api.get("/reviews"), []);
  const [reviewForms, setReviewForms] = useState({});

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((item) => item.course?._id)),
    [enrollments]
  );
  const availableCourses = useMemo(
    () => courses.filter((course) => !enrolledIds.has(course._id) && course.status === "published"),
    [courses, enrolledIds]
  );
  const filteredQuestions = useMemo(
    () => questions.filter((item) => item.question.toLowerCase().includes(search.toLowerCase())),
    [questions, search]
  );

  const dashStats = useMemo(() => {
    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
      : 0;
    const completed = enrollments.filter((e) => e.progress === 100).length;
    const liveCount = Array.isArray(liveClasses) ? liveClasses.filter((lc) => lc.status === "live").length : 0;
    return { avgProgress, completed, liveCount };
  }, [enrollments, liveClasses]);

  const courseProgressChart = useMemo(() => ({
    labels: enrollments.slice(0, 8).map((e) => {
      const t = e.course?.title || "Course";
      return t.length > 14 ? t.slice(0, 14) + "…" : t;
    }),
    values: enrollments.slice(0, 8).map((e) => e.progress || 0),
  }), [enrollments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshLiveClasses();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [refreshLiveClasses]);

  const enroll = async (courseId) => {
    try {
      await api.post("/enrollments", { courseId });
      toast.success("Enrolled successfully");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Enrollment failed");
    }
  };

  const submitQuestion = async () => {
    if (!question.trim()) return;
    try {
      await api.post("/questions", { question, course: selectedCourse || null });
      toast.success("Question submitted");
      setQuestion("");
      setSelectedCourse("");
      refreshQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit question");
    }
  };

  const submitReview = async (courseId, existingReview) => {
    const form = reviewForms[courseId];
    if (!form) return;
    try {
      if (existingReview) {
        await api.put(`/reviews/${existingReview._id}`, form);
        toast.success("Review updated");
      } else {
        await api.post("/reviews", { ...form, course: courseId });
        toast.success("Review added");
      }
      refreshReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save review");
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted");
      refreshReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete review");
    }
  };

  if (loading) return <Loader variant="skeleton" label="Loading your courses..." />;

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled Courses" value={enrollments.length} helper="Active course enrollments" icon="📚" accentColor="teal" />
        <StatCard label="Completed" value={dashStats.completed} helper="Courses finished at 100%" icon="✅" accentColor="indigo" />
        <StatCard label="Avg Progress" value={`${dashStats.avgProgress}%`} helper="Across all courses" icon="📈" accentColor="amber" trend={dashStats.avgProgress >= 50 ? "up" : "neutral"} />
        <StatCard label="Live Now" value={dashStats.liveCount} helper="Active live classes" icon="🔴" accentColor="rose" />
      </div>

      {/* Course progress chart */}
      {enrollments.length > 0 ? (
        <ChartCard title="Course Progress" subtitle="Your progress across enrolled courses">
          <BarChart
            labels={courseProgressChart.labels}
            datasets={[{ label: "Progress %", data: courseProgressChart.values, backgroundColor: "rgba(15, 118, 110, 0.85)" }]}
            height={220}
          />
        </ChartCard>
      ) : null}

      <section>
        <h2 className="font-display text-3xl text-slate-900">My Courses</h2>
        <p className="mt-2 text-sm text-slate-500">Continue learning, track progress, and download certificates when you finish.</p>
        {!enrollments.length ? (
          <div className="mt-6">
            <EmptyState title="No enrolled courses yet" description="Enroll in a course from the catalog below to get started." icon="📖" />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => {
              const liveTestStatus = getLiveTestStatus(enrollment.course?.liveTest);

              return (
                <article key={enrollment._id} className="animate-fadeIn overflow-hidden rounded-[28px] bg-white shadow-panel transition hover:shadow-lg">
                  <div className="h-44 bg-slate-100">
                    {enrollment.course?.thumbnail ? (
                      <img src={getFullImageUrl(enrollment.course.thumbnail)} alt={enrollment.course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-teal-100 to-amber-100 font-display text-3xl">
                        {enrollment.course?.title?.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-2xl">{enrollment.course?.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{enrollment.course?.instructorDisplayName || enrollment.course?.instructor?.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {enrollment.course?.notes?.length ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {enrollment.course.notes.length} note{enrollment.course.notes.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {enrollment.course?.liveTest?.enabled ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            liveTestStatus.tone === "emerald"
                              ? "bg-emerald-100 text-emerald-700"
                              : liveTestStatus.tone === "amber"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          Live Test {liveTestStatus.label}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 h-3 rounded-full bg-slate-100">
                      <div className="h-3 rounded-full bg-teal-700 transition-all" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{enrollment.progress}% complete</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link to={`/learner/courses/${enrollment._id}`} className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-800">
                        Continue Learning
                      </Link>
                      {enrollment.progress === 100 && enrollment.course?.advancedSettings?.certificateEnabled ? (
                        <button
                          className="rounded-2xl border px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
                          onClick={() =>
                            downloadCertificate({
                              learnerName: user.name,
                              courseTitle: enrollment.course.title
                            })
                          }
                        >
                          Download Certificate
                        </button>
                      ) : null}
                      {liveTestStatus.canJoin ? (
                        <a
                          href={enrollment.course?.liveTest?.link}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border px-4 py-3 text-sm font-medium transition hover:bg-slate-50"
                        >
                          Live Test
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Course Catalog</h2>
            <p className="mt-2 text-sm text-slate-500">Browse available published courses and enroll in one click.</p>
          </div>
        </div>
        {!availableCourses.length ? (
          <div className="mt-6">
            <EmptyState title="All caught up!" description="You're enrolled in all available courses." icon="🎉" />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {availableCourses.map((course) => (
              <div key={course._id} className="rounded-3xl border border-slate-100 p-5 transition hover:border-teal-200 hover:shadow-md">
                <h3 className="font-display text-2xl">{course.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{stripHtml(course.tagline || course.description)}</p>
                <p className="mt-3 text-sm font-semibold text-teal-700">
                  {course.pricing?.type === "free" ? "Free" : `${course.pricing.currency} ${course.pricing.amount}`}
                </p>
                <button className="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800" onClick={() => enroll(course._id)}>
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
        <h2 className="font-display text-2xl">Live Classes</h2>
        <p className="mt-2 text-sm text-slate-500">Join live sessions from your dashboard when they are active.</p>
        {!liveClasses.length ? (
          <div className="mt-5">
            <EmptyState title="No live classes" description="Scheduled and active live classes will appear here." icon="📡" />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {liveClasses.map((liveClass) => (
              <div key={liveClass._id} className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{liveClass.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{liveClass.course?.title || "Standalone session"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${liveClass.status === "live" ? "bg-emerald-100 text-emerald-700" : liveClass.status === "scheduled" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {liveClass.status}
                  </span>
                </div>
                {liveClass.status === "live" ? (
                  <button
                    className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    onClick={() => window.open(buildLiveClassJoinUrl(liveClass, user), "_blank", "noopener,noreferrer")}
                  >
                    Join Live Class
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <div className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
          <h2 className="font-display text-2xl">Public Q&A</h2>
          <p className="mt-2 text-sm text-slate-500">Ask a question and browse answered ones.</p>
          <select className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">General question</option>
            {enrollments.map((enrollment) => (
              <option key={enrollment._id} value={enrollment.course?._id}>{enrollment.course?.title}</option>
            ))}
          </select>
          <textarea className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3" rows="4" placeholder="Ask your question here" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button className="mt-4 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-800" onClick={submitQuestion}>
            Submit Question
          </button>
          <input className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Search answered questions" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="mt-4 space-y-3">
            {filteredQuestions.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No questions match your search.</p>
            ) : (
              filteredQuestions.map((item) => (
                <details key={item._id} className="rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
                  <summary className="cursor-pointer font-medium text-slate-900">{item.question}</summary>
                  <p className="mt-3 text-sm text-slate-500">{item.answer || "Awaiting an answer..."}</p>
                </details>
              ))
            )}
          </div>
        </div>

        <div className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
          <h2 className="font-display text-2xl">Course Reviews</h2>
          <div className="mt-5 space-y-6">
            {enrollments.map((enrollment) => {
              const courseId = enrollment.course?._id;
              const courseReviews = reviews.filter((review) => review.course?._id === courseId);
              const ownReview = courseReviews.find((review) => review.learner?._id === user._id);
              const form = reviewForms[courseId] || {
                rating: ownReview?.rating || 5,
                comment: ownReview?.comment || ""
              };

              return (
                <div key={enrollment._id} className="rounded-3xl border border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{enrollment.course?.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">Average rating: {average(courseReviews.map((review) => review.rating))}</p>
                    </div>
                    <Stars
                      rating={form.rating}
                      onChange={(value) =>
                        setReviewForms({
                          ...reviewForms,
                          [courseId]: { ...form, rating: value }
                        })
                      }
                    />
                  </div>
                  <textarea
                    rows="3"
                    className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3"
                    placeholder="Share your learning experience"
                    value={form.comment}
                    onChange={(e) =>
                      setReviewForms({
                        ...reviewForms,
                        [courseId]: { ...form, comment: e.target.value }
                      })
                    }
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800" onClick={() => submitReview(courseId, ownReview)}>
                      {ownReview ? "Update Review" : "Submit Review"}
                    </button>
                    {ownReview ? (
                      <button className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50" onClick={() => deleteReview(ownReview._id)}>
                        Delete Review
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-3">
                    {courseReviews.map((review) => (
                      <div key={review._id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{review.learner?.name}</p>
                          <Stars rating={review.rating} readonly />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LearnerDashboardPage;
