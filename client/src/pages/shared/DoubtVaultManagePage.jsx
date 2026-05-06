import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate, getFullFileUrl } from "../../utils/helpers";

const STATUS_PILL = {
  pending: "bg-amber-100 text-amber-700",
  answered: "bg-emerald-100 text-emerald-700",
  reopened: "bg-rose-100 text-rose-700"
};

const SUBJECT_PILL = {
  physics: "bg-blue-100 text-blue-700",
  chemistry: "bg-amber-100 text-amber-700",
  biology: "bg-pink-100 text-pink-700",
  mathematics: "bg-emerald-100 text-emerald-700",
  default: "bg-slate-100 text-slate-700"
};

const StatBig = ({ label, value, icon, accent, active }) => (
  <div className={`flex items-center justify-between rounded-2xl border-2 p-5 shadow-card transition ${
    active ? "border-brand-accent bg-white" : "border-slate-200/70 bg-white"
  }`}>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-ink">{value}</p>
    </div>
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
  </div>
);

const DoubtVaultManagePage = () => {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [answers, setAnswers] = useState({});
  const [openDoubt, setOpenDoubt] = useState(null);
  const { data: doubts, loading, refresh } = useFetch(
    () => api.get(status ? `/doubts?status=${status}` : "/doubts"),
    [status]
  );

  const filtered = useMemo(
    () => doubts.filter((d) => !search || d.question?.toLowerCase().includes(search.toLowerCase()) || d.learner?.name?.toLowerCase().includes(search.toLowerCase())),
    [doubts, search]
  );

  const counts = useMemo(() => ({
    pending: doubts.filter((d) => d.status === "pending" || d.status === "reopened").length,
    resolvedToday: doubts.filter((d) => {
      if (d.status !== "answered" || !d.answeredAt) return false;
      const t = new Date(d.answeredAt);
      const today = new Date();
      return t.toDateString() === today.toDateString();
    }).length
  }), [doubts]);

  const answerDoubt = async (id) => {
    try {
      await api.put(`/doubts/${id}/answer`, { answer: answers[id] || "" });
      toast.success("Doubt resolved");
      setAnswers({ ...answers, [id]: "" });
      setOpenDoubt(null);
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <Loader label="Loading doubts..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Doubt Vault Command Center</h1>
        <p className="mt-1 text-sm text-slate-500">Manage and resolve student queries across all batches with precision.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatBig
          label="Pending Doubts" value={counts.pending}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
          accent="bg-amber-100 text-amber-700"
          active
        />
        <StatBig
          label="Resolved Today" value={counts.resolvedToday}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4l-10 10-3-3" /></svg>}
          accent="bg-emerald-100 text-emerald-700"
          active
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doubts, students, or batches..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium capitalize">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="reopened">Reopened</option>
          <option value="answered">Answered</option>
        </select>
      </div>

      {/* Doubts list */}
      {!filtered.length ? (
        <EmptyState title="No doubts" description="Doubts matching this filter will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 8).map((d) => {
            const subClass = SUBJECT_PILL[d.subject?.toLowerCase()] || SUBJECT_PILL.default;
            return (
              <article key={d._id} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-surface text-xs font-bold text-brand-primary">
                    {d.learner?.name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-brand-ink">{d.learner?.name || "Anonymous"}</p>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {d.batch?.name || "JEE MAIN 2024"}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${subClass}`}>{d.subject || "physics"}</span>
                      <span className="ml-auto text-[10px] text-slate-400">{formatDate(d.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-brand-ink">"{d.question}"</p>
                    {d.audio?.path ? (
                      <audio className="mt-3 w-full" controls src={getFullFileUrl(d.audio.path)} />
                    ) : null}
                    {d.attachment?.name ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                        {d.attachment.name}
                      </div>
                    ) : null}

                    {d.status === "answered" ? (
                      <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-slate-700">
                        <p>{d.answer}</p>
                        <p className="mt-1 text-[10px] uppercase text-slate-400">— {d.answeredBy?.name || "Teacher"}</p>
                      </div>
                    ) : openDoubt === d._id ? (
                      <div className="mt-3 space-y-2">
                        <textarea rows="3" value={answers[d._id] || ""} onChange={(e) => setAnswers({ ...answers, [d._id]: e.target.value })}
                          placeholder="Type resolution..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setOpenDoubt(null)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs">Cancel</button>
                          <button onClick={() => answerDoubt(d._id)} className="rounded-md bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95">Submit</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex justify-end">
                        <button onClick={() => setOpenDoubt(d._id)}
                          className="rounded-md bg-brand-cta px-4 py-1.5 text-xs font-bold text-white hover:brightness-95">
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filtered.length > 8 ? (
        <button className="w-full rounded-2xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-500 hover:bg-slate-50">
          Load {filtered.length - 8} more pending queries
        </button>
      ) : null}
    </div>
  );
};

export default DoubtVaultManagePage;
