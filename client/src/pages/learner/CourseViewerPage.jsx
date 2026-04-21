import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";

const CourseViewerPage = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { data: enrollments, loading, refresh } = useFetch(() => api.get("/enrollments/mine"), []);
  const [activeIndex, setActiveIndex] = useState(0);

  const enrollment = useMemo(
    () => enrollments.find((item) => item._id === enrollmentId),
    [enrollments, enrollmentId]
  );

  if (loading) return <Loader label="Loading course..." />;
  if (!enrollment) return <div className="rounded-[28px] bg-white p-10 shadow-panel">Course not found.</div>;

  const pages = enrollment.course?.pages || [];
  const activePage = pages[activeIndex];

  const markComplete = async () => {
    try {
      await api.put(`/enrollments/${enrollment._id}/progress`, { completedPageIndex: activeIndex });
      toast.success("Progress updated");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update progress");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <aside className="rounded-[28px] bg-white p-5 shadow-panel">
        <button className="mb-4 rounded-2xl border px-4 py-3 text-sm" onClick={() => navigate("/learner")}>
          Back to My Courses
        </button>
        <h2 className="font-display text-2xl">{enrollment.course?.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{enrollment.progress}% complete</p>
        <div className="mt-5 space-y-2">
          {pages.map((page, index) => (
            <button
              key={`${page.title}-${index}`}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm ${
                activeIndex === index ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-600"
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {index + 1}. {page.title}
            </button>
          ))}
        </div>
      </aside>
      <section className="rounded-[28px] bg-white p-6 shadow-panel">
        <h1 className="font-display text-3xl">{activePage?.title}</h1>
        <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: activePage?.content || "" }} />
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white" onClick={markComplete}>
            Mark Page as Complete
          </button>
          <button
            className="rounded-2xl border px-4 py-3 text-sm font-medium"
            onClick={() => setActiveIndex((value) => Math.min(value + 1, pages.length - 1))}
          >
            Next Chapter
          </button>
        </div>
      </section>
    </div>
  );
};

export default CourseViewerPage;
