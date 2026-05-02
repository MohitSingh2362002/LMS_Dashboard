import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate, getFullFileUrl } from "../../utils/helpers";

const emptyForm = {
  course: "",
  subject: "",
  chapter: "",
  topic: "",
  question: "",
  audio: null
};

const LearnerDoubtVaultPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const { data: enrollments, loading: loadingEnrollments } = useFetch(() => api.get("/enrollments/mine"), []);
  const { data: doubts, loading: loadingDoubts, refresh } = useFetch(
    () => api.get(status ? `/doubts?status=${status}` : "/doubts"),
    [status]
  );

  const courses = useMemo(() => enrollments.map((item) => item.course).filter(Boolean), [enrollments]);

  const submitDoubt = async (event) => {
    event.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });
      await api.post("/doubts", payload, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Doubt submitted");
      setForm(emptyForm);
      event.target.reset();
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit doubt");
    }
  };

  const reopenDoubt = async (id) => {
    try {
      await api.put(`/doubts/${id}/reopen`);
      toast.success("Doubt reopened");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reopen doubt");
    }
  };

  if (loadingEnrollments || loadingDoubts) return <Loader label="Loading Doubt Vault..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Doubt Vault</p>
        <h2 className="font-display text-3xl text-slate-900">Instant Problem Resolution</h2>
        <p className="mt-2 text-sm text-slate-500">Submit text or audio doubts and track teacher responses.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
        <form onSubmit={submitDoubt} className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Ask a Doubt</h3>
          <div className="mt-5 space-y-4">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })}>
              <option value="">General doubt</option>
              {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Chapter" value={form.chapter} onChange={(event) => setForm({ ...form, chapter: event.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} />
            </div>
            <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows="5" placeholder="Write your doubt" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} required />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="file" accept="audio/*" onChange={(event) => setForm({ ...form, audio: event.target.files?.[0] || null })} />
          </div>
          <button className="mt-5 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">Submit Doubt</button>
        </form>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl">My Doubts</h3>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          {!doubts.length ? <div className="mt-5"><EmptyState title="No doubts yet" description="Submit your first doubt to begin." /></div> : null}
          <div className="mt-5 space-y-4">
            {doubts.map((doubt) => (
              <article key={doubt._id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{doubt.question}</p>
                    <p className="mt-2 text-sm text-slate-500">{doubt.course?.title || "General"} · {doubt.assignedTeacher?.name || "Teacher assignment pending"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{doubt.status}</span>
                </div>
                {doubt.audio?.path ? <audio className="mt-4 w-full" controls src={getFullFileUrl(doubt.audio.path)} /> : null}
                {doubt.answer ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>{doubt.answer}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{formatDate(doubt.answeredAt)}</p>
                    <button className="mt-3 rounded-2xl border px-4 py-2 text-sm font-medium" onClick={() => reopenDoubt(doubt._id)}>
                      Reopen
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LearnerDoubtVaultPage;
