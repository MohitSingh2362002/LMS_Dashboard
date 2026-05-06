import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import Stars from "../../components/Stars";
import { average, formatDate } from "../../utils/helpers";

const StarBar = ({ count, total, stars }) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-slate-500">{stars}</span>
      <span className="text-amber-400">★</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-slate-400">{count}</span>
    </div>
  );
};

const ReviewCard = ({ review, onDelete, onReply }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(review.adminReply || "");
  const [saving, setSaving] = useState(false);
  const initials = (review.learner?.name || "?").slice(0, 2).toUpperCase();

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    await onReply(review._id, replyText);
    setSaving(false);
    setShowReply(false);
  };

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card transition-all hover:shadow-cardHover">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-surface text-sm font-bold text-brand-primary">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-brand-ink">{review.learner?.name || "Anonymous"}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">
                #{review.course?.title?.toUpperCase().replace(/\s/g, "-").slice(0, 20) || "COURSE"} · {formatDate(review.createdAt)}
              </p>
            </div>
            <Stars rating={review.rating} readonly />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-700">{review.comment}</p>

          {/* Existing admin reply */}
          {review.adminReply ? (
            <div className="mt-3 rounded-lg border border-brand-accent/20 bg-brand-surface px-3 py-2.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary">Admin Reply</p>
              <p className="text-xs leading-relaxed text-slate-700">{review.adminReply}</p>
              {review.adminRepliedAt ? (
                <p className="mt-1 text-[10px] text-slate-400">{formatDate(review.adminRepliedAt)}</p>
              ) : null}
            </div>
          ) : null}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
            <button
              onClick={() => { setShowReply((v) => !v); setReplyText(review.adminReply || ""); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              {review.adminReply ? "Edit Reply" : "Reply"}
            </button>
            <button onClick={() => onDelete(review._id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
              Delete
            </button>
          </div>

          {showReply ? (
            <div className="mt-3 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-brand-accent focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={saving || !replyText.trim()}
                className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50">
                {saving ? "Saving…" : "Send"}
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

// Modal showing all course ratings
const AllRatingsModal = ({ courseRatings, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
    <div
      className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white shadow-panel"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-bold text-brand-ink">All Course Ratings</h3>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
        {courseRatings.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No rated courses yet.</p>
        ) : courseRatings.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-3">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${
              i === 0 ? "bg-brand-primary" : i === 1 ? "bg-brand-accent" : i === 2 ? "bg-brand-cta" : "bg-slate-400"
            }`}>
              #{i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-ink">{c.title}</p>
              <p className="text-[10px] text-slate-500">{c.count} review{c.count !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-400">★</span>
              <span className="text-sm font-bold text-brand-ink">{c.avg}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-5 py-3 text-right">
        <button onClick={onClose} className="rounded-lg bg-brand-surface px-4 py-2 text-xs font-semibold text-brand-primary hover:bg-brand-surface/70">
          Close
        </button>
      </div>
    </div>
  </div>
);

const AdminReviewsPage = () => {
  const [courseId, setCourseId] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [showAllRatings, setShowAllRatings] = useState(false);

  const { data: rawCourses } = useFetch(() => api.get("/courses"), []);
  const { data: rawReviews, loading, refresh } = useFetch(
    () => api.get(courseId ? `/reviews?courseId=${courseId}` : "/reviews"),
    [courseId]
  );

  // Always safe arrays regardless of API shape
  const reviews = useMemo(() => (Array.isArray(rawReviews) ? rawReviews : []), [rawReviews]);
  const courses = useMemo(() => (Array.isArray(rawCourses) ? rawCourses : []), [rawCourses]);

  const filtered = useMemo(
    () => ratingFilter ? reviews.filter((r) => String(r.rating) === ratingFilter) : reviews,
    [reviews, ratingFilter]
  );

  const stats = useMemo(() => {
    const avg = average(reviews.map((r) => r.rating));
    const dist = [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: reviews.filter((r) => r.rating === s).length }));
    return { avg, total: reviews.length, dist };
  }, [reviews]);

  const courseRatings = useMemo(() => {
    return courses.map((c) => {
      const cr = reviews.filter((r) => r.course?._id === c._id);
      return { id: c._id, title: c.title, avg: average(cr.map((r) => r.rating)), count: cr.length };
    }).filter((c) => c.count > 0).sort((a, b) => b.avg - a.avg);
  }, [courses, reviews]);

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try { await api.delete(`/reviews/${id}`); toast.success("Review deleted"); refresh(); }
    catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  const replyToReview = async (id, replyText) => {
    try {
      await api.post(`/reviews/${id}/reply`, { reply: replyText });
      toast.success("Reply saved");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reply failed");
    }
  };

  if (loading) return <Loader label="Loading reviews..." />;

  return (
    <>
      {showAllRatings ? (
        <AllRatingsModal courseRatings={courseRatings} onClose={() => setShowAllRatings(false)} />
      ) : null}

      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Review &amp; Ratings Management</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor student sentiment and manage course feedback across the institution.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
          {/* Reviews feed */}
          <section className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-bold text-brand-ink">Recent Reviews Feed</h2>
              <div className="ml-auto flex gap-2">
                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold">
                  <option value="">All Ratings</option>
                  {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} Stars</option>)}
                </select>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold max-w-[160px] truncate">
                  <option value="">All Courses</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            {!filtered.length ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
                No reviews match the current filter.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, 6).map((r) => (
                  <ReviewCard key={r._id} review={r} onDelete={deleteReview} onReply={replyToReview} />
                ))}
              </div>
            )}

            {filtered.length > 6 ? (
              <button className="w-full rounded-2xl border border-dashed border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">
                LOAD MORE REVIEWS
              </button>
            ) : null}
          </section>

          {/* Right panel */}
          <aside className="space-y-4">
            {/* Rating summary */}
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg Rating</p>
                  <p className="mt-1 text-5xl font-bold text-brand-ink">{stats.avg}</p>
                  <div className="mt-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-lg ${s <= Math.round(stats.avg) ? "text-amber-400" : "text-slate-200"}`}>★</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Reviews</p>
                  <p className="mt-1 text-3xl font-bold text-brand-ink">{stats.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {stats.dist.map((d) => (
                  <StarBar key={d.stars} stars={d.stars} count={d.count} total={stats.total} />
                ))}
              </div>
            </div>

            {/* Top rated courses */}
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
              <h3 className="mb-3 text-sm font-bold text-brand-ink">Top Rated Courses</h3>
              <div className="space-y-2.5">
                {courseRatings.slice(0, 4).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${
                      i === 0 ? "bg-brand-primary" : i === 1 ? "bg-brand-accent" : i === 2 ? "bg-brand-cta" : "bg-slate-400"
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">{c.title}</p>
                      <p className="text-[10px] text-slate-500">{c.count} review{c.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span className="text-xs font-bold text-brand-ink">{c.avg}</span>
                    </div>
                  </div>
                ))}
                {!courseRatings.length ? (
                  <p className="text-xs text-slate-400">No rated courses yet</p>
                ) : null}
              </div>
              <button
                onClick={() => setShowAllRatings(true)}
                className="mt-4 w-full rounded-lg border border-brand-accent/30 bg-brand-surface py-2 text-xs font-semibold text-brand-primary hover:bg-brand-surface/70">
                VIEW ALL COURSE RATINGS ({courseRatings.length})
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default AdminReviewsPage;
