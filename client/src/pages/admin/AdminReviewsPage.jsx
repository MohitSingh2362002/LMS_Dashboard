import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import Stars from "../../components/Stars";
import { average, formatDate } from "../../utils/helpers";

const AdminReviewsPage = () => {
  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState("");
  const { data: courses } = useFetch(() => api.get("/courses"), []);
  const { data: reviews, loading, refresh } = useFetch(
    () => api.get(courseId ? `/reviews?courseId=${courseId}` : "/reviews"),
    [courseId]
  );

  const filteredReviews = useMemo(
    () => (rating ? reviews.filter((review) => String(review.rating) === rating) : reviews),
    [reviews, rating]
  );

  const courseRatings = useMemo(() => {
    return courses.map((course) => {
      const courseReviews = reviews.filter((review) => review.course?._id === course._id);
      return {
        id: course._id,
        title: course.title,
        averageRating: average(courseReviews.map((review) => review.rating))
      };
    });
  }, [courses, reviews]);

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete review");
    }
  };

  if (loading) return <Loader label="Loading reviews..." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl">Reviews & Ratings</h2>
              <p className="mt-2 text-sm text-slate-500">Filter reviews by course or star rating.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </select>
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={rating} onChange={(e) => setRating(e.target.value)}>
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((star) => (
                  <option key={star} value={star}>{star} stars</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Learner</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Comment</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review._id} className="border-t border-slate-100 align-top">
                    <td className="py-4 font-medium">{review.course?.title}</td>
                    <td className="py-4">{review.learner?.name}</td>
                    <td className="py-4"><Stars rating={review.rating} readonly /></td>
                    <td className="py-4 text-slate-500">{review.comment}</td>
                    <td className="py-4 text-slate-500">{formatDate(review.createdAt)}</td>
                    <td className="py-4">
                      <button className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600" onClick={() => deleteReview(review._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h2 className="font-display text-2xl">Average Rating by Course</h2>
          <div className="mt-5 space-y-4">
            {courseRatings.map((course) => (
              <div key={course.id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-medium">{course.title}</p>
                <p className="mt-1 text-sm text-slate-500">{course.averageRating} / 5.0</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminReviewsPage;
