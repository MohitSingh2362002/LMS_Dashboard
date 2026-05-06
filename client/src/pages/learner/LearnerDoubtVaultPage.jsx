import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { getFullFileUrl } from "../../utils/helpers";

const emptyForm = { course: "", topic: "", question: "", image: null };

/* ── Status Badge ─────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = {
    answered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending:  "bg-amber-100  text-amber-700  border-amber-200",
  }[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg}`}>
      {status}
    </span>
  );
};

/* ── Subject initial bubble ────────────────────────────────────────────── */
const SubjectBubble = ({ title }) => {
  const initials = (title || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = ["bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700"];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${color}`}>
      {initials}
    </div>
  );
};

/* ── Doubt Card ─────────────────────────────────────────────────────────── */
const DoubtCard = ({ doubt, onReopen }) => (
  <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card transition hover:shadow-md">
    {/* Header */}
    <div className="flex items-start gap-3">
      <SubjectBubble title={doubt.subject || doubt.course?.title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-brand-ink truncate">
            {doubt.subject || doubt.course?.title || "General Doubt"}
          </h4>
          <StatusBadge status={doubt.status} />
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {doubt.topic || doubt.chapter || "General"} ·{" "}
          {new Date(doubt.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>
    </div>

    {/* Question */}
    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Your Question</p>
      <p className="text-sm leading-relaxed text-brand-ink">"{doubt.question}"</p>
    </div>

    {/* Attachments */}
    {doubt.image?.path && (
      <img
        src={getFullFileUrl(doubt.image.path)}
        alt="Doubt attachment"
        className="mt-3 h-36 w-full rounded-xl border border-slate-200 object-cover"
      />
    )}
    {doubt.audio?.path && (
      <audio className="mt-3 w-full" controls src={getFullFileUrl(doubt.audio.path)} />
    )}

    {/* Answer / Pending */}
    {doubt.answer ? (
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            {(doubt.answeredBy?.name || doubt.assignedTeacher?.name || "M").slice(0, 1)}
          </div>
          <p className="text-xs font-bold text-emerald-700">
            {doubt.answeredBy?.name || doubt.assignedTeacher?.name || "Mentor"}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-brand-ink">{doubt.answer}</p>
        <button
          onClick={() => onReopen(doubt._id)}
          className="mt-3 text-xs font-bold text-brand-primary hover:underline"
        >
          ↺ Reopen Doubt
        </button>
      </div>
    ) : (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-amber-500">⏳</span>
        <p className="text-xs font-medium text-amber-700">A mentor will respond to your doubt soon.</p>
      </div>
    )}
  </article>
);

/* ── Main Page ──────────────────────────────────────────────────────────── */
const LearnerDoubtVaultPage = () => {
  const [form, setForm]     = useState(emptyForm);
  const [filter, setFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef(null);

  const { data: enrollments, loading: loadingEnroll } = useFetch(() => api.get("/enrollments/mine"), []);
  const { data: doubts, loading: loadingDoubts, refresh } = useFetch(
    () => api.get(filter ? `/doubts?status=${filter}` : "/doubts"),
    [filter]
  );

  const courses = useMemo(() => enrollments.map((e) => e.course).filter(Boolean), [enrollments]);

  const counts = useMemo(() => ({
    all:      doubts.length,
    answered: doubts.filter((d) => d.status === "answered").length,
    pending:  doubts.filter((d) => d.status === "pending").length,
  }), [doubts]);

  const submitDoubt = async (e) => {
    e.preventDefault();
    if (!form.question.trim()) return toast.error("Please describe your doubt");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      await api.post("/doubts", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Doubt submitted! A mentor will respond soon.");
      setForm(emptyForm);
      if (imageRef.current) imageRef.current.value = "";
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit doubt");
    } finally {
      setSubmitting(false);
    }
  };

  const reopenDoubt = async (id) => {
    try {
      await api.put(`/doubts/${id}/reopen`);
      toast.success("Doubt reopened");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to reopen");
    }
  };

  if (loadingEnroll || loadingDoubts) return <Loader label="Loading Doubt Vault…" />;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-ink">Doubt Vault</h1>
        <p className="mt-1 text-sm text-slate-500">Ask your mentor and get answers to all your academic doubts.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

        {/* ── Submit Form ── */}
        <div className="h-fit rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
          <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-brand-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-brand-primary">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Ask a New Doubt
          </h2>
          <form onSubmit={submitDoubt} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Subject / Course</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              >
                <option value="">Select a subject</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Topic / Chapter</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                placeholder="e.g. Quantum Mechanics, Organic Chemistry"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>

            {/* Question */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Your Doubt</label>
              <textarea
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
                rows={5}
                placeholder="Describe your doubt in detail. The more specific you are, the better the answer…"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                required
              />
            </div>

            {/* Image upload */}
            <div
              className="group cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 hover:border-brand-primary hover:bg-brand-surface transition"
              onClick={() => imageRef.current?.click()}
            >
              {form.image ? (
                <div className="flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(form.image)}
                    alt="preview"
                    className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-brand-ink">{form.image.name}</p>
                    <p className="text-[10px] text-slate-400">Click to change</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: null }); if (imageRef.current) imageRef.current.value = ""; }}
                    className="text-slate-400 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 group-hover:text-brand-primary transition">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold group-hover:text-brand-primary transition">Attach an image</p>
                    <p className="text-[10px]">PNG, JPG up to 5 MB</p>
                  </div>
                </div>
              )}
              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-60 transition"
            >
              {submitting ? "Submitting…" : "Submit Doubt"}
            </button>
          </form>
        </div>

        {/* ── Doubts List ── */}
        <div className="min-w-0">
          {/* Filter tabs */}
          <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-base font-extrabold text-brand-ink">My Doubts</h2>
            <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {[
                { key: "",         label: `All (${counts.all})` },
                { key: "answered", label: `Answered (${counts.answered})` },
                { key: "pending",  label: `Pending (${counts.pending})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 text-xs font-bold transition ${
                    filter === key
                      ? "bg-brand-primary text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-brand-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {doubts.length === 0 ? (
            <EmptyState
              title={filter ? `No ${filter} doubts` : "No doubts yet"}
              description={filter ? "Try a different filter." : "Submit your first doubt using the form."}
            />
          ) : (
            <div className="space-y-4">
              {doubts.map((d) => (
                <DoubtCard key={d._id} doubt={d} onReopen={reopenDoubt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerDoubtVaultPage;
