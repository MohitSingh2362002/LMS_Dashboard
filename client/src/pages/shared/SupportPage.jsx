import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { formatDate } from "../../utils/helpers";

const PRIORITY = {
  low: { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400", label: "Low" },
  medium: { cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400", label: "Medium" },
  high: { cls: "bg-rose-100 text-rose-700", dot: "bg-rose-500", label: "High" },
  urgent: { cls: "bg-red-600 text-white", dot: "bg-rose-500", label: "Urgent" },
};

const STATUS = {
  open: { cls: "bg-blue-100 text-blue-700", label: "Open" },
  "in-progress": { cls: "bg-amber-100 text-amber-700", label: "In Progress" },
  resolved: { cls: "bg-emerald-100 text-emerald-700", label: "Resolved" },
  closed: { cls: "bg-slate-100 text-slate-600", label: "Closed" },
};

const CATEGORIES = ["general", "technical", "billing", "academic"];

/* ── Create form ─────────────────────────────────────────────────── */
const CreateForm = ({ onCreated }) => {
  const [form, setForm] = useState({ title: "", description: "", category: "general", priority: "medium" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required"); return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/support", form);
      toast.success("Support ticket raised!");
      onCreated(data);
      setForm({ title: "", description: "", category: "general", priority: "medium" });
    } catch (err) { toast.error(err.response?.data?.message || "Failed to submit"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-brand-primary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-extrabold text-brand-ink">Raise a Support Ticket</h2>
          <p className="text-xs text-slate-500">Our team will respond within 24 hours</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">Issue Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            placeholder="Brief summary of your issue…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize focus:border-brand-primary focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize focus:border-brand-primary focus:outline-none">
              {Object.keys(PRIORITY).map((p) => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-ink">Description *</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required
            rows={4} placeholder="Describe your issue in detail…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition" />
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="mt-5 w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-50 transition">
        {saving ? "Submitting…" : "Submit Ticket"}
      </button>
    </form>
  );
};

/* ── Ticket card ─────────────────────────────────────────────────── */
const TicketCard = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  const p = PRIORITY[ticket.priority] || PRIORITY.medium;
  const s = STATUS[ticket.status] || STATUS.open;

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 text-left">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${p.dot}`} />
            <div>
              <p className="text-sm font-bold text-brand-ink">{ticket.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 capitalize">{ticket.category} · {formatDate(ticket.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${p.cls}`}>{p.label}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${s.cls}`}>{s.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <p className="mt-4 text-sm text-slate-700 leading-relaxed">{ticket.description}</p>

          {/* Responses */}
          {ticket.responses?.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Admin Responses</p>
              {ticket.responses.map((r, i) => (
                <div key={i} className="rounded-xl border border-brand-primary/20 bg-brand-surface p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white">
                      {(r.by?.name || "A").slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-[11px] font-semibold text-brand-primary">{r.by?.name || "Admin"}</p>
                    <p className="ml-auto text-[10px] text-slate-400">{formatDate(r.at)}</p>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{r.message}</p>
                </div>
              ))}
            </div>
          )}

          {ticket.responses?.length === 0 && (
            <p className="mt-3 text-xs text-slate-400 italic">Awaiting admin response…</p>
          )}
        </div>
      )}
    </article>
  );
};

/* ── Main page ───────────────────────────────────────────────────── */
const SupportPage = () => {
  const { data, loading, setData } = useFetch(() => api.get("/support/mine"), []);
  const tickets = Array.isArray(data) ? data : [];

  const handleCreated = (t) => setData((prev) => [t, ...(Array.isArray(prev) ? prev : [])]);

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Support Center</h1>
          <p className="mt-1 text-sm text-slate-500">Raise and track your support queries with the admin team.</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Open", val: stats.open, cls: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "In Progress", val: stats.inProgress, cls: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "Resolved", val: stats.resolved, cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-4 py-2 text-center ${s.cls}`}>
              <p className="text-lg font-extrabold">{s.val}</p>
              <p className="text-[10px] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        {/* Create form */}
        <div><CreateForm onCreated={handleCreated} /></div>

        {/* Ticket list */}
        <div className="space-y-3">
          {loading ? <Loader label="Loading tickets…" /> :
            !tickets.length ? (
              <EmptyState title="No support tickets yet" description="Raise your first ticket using the form." />
            ) : (
              tickets.map((t) => <TicketCard key={t._id} ticket={t} />)
            )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
