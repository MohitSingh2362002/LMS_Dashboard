import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { formatDate } from "../../utils/helpers";

const PRIORITY = {
  low:    { cls: "bg-slate-100 text-slate-600",       dot: "bg-slate-400",  label: "Low"    },
  medium: { cls: "bg-amber-100 text-amber-700",       dot: "bg-amber-400",  label: "Medium" },
  high:   { cls: "bg-rose-100 text-rose-700",         dot: "bg-rose-500",   label: "High"   },
  urgent: { cls: "bg-red-600 text-white",              dot: "bg-white",      label: "Urgent" },
};
const STATUS = {
  open:          { cls: "bg-blue-100 text-blue-700",       label: "Open"        },
  "in-progress": { cls: "bg-amber-100 text-amber-700",     label: "In Progress" },
  resolved:      { cls: "bg-emerald-100 text-emerald-700", label: "Resolved"    },
  closed:        { cls: "bg-slate-100 text-slate-600",     label: "Closed"      },
};
const ROLE_BADGE = {
  instructor: "bg-violet-100 text-violet-700",
  learner:    "bg-sky-100 text-sky-700",
  parent:     "bg-teal-100 text-teal-700",
  admin:      "bg-slate-100 text-slate-600",
};

/* ── Ticket detail panel ─────────────────────────────────────────── */
const TicketPanel = ({ ticket, onUpdated, onClose }) => {
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);

  const p = PRIORITY[ticket.priority] || PRIORITY.medium;
  const s = STATUS[ticket.status] || STATUS.open;

  const submitReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/support/${ticket._id}/respond`, { message: reply, status: newStatus });
      toast.success("Response sent");
      setReply("");
      onUpdated(data);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const changeStatus = async (status) => {
    try {
      const { data } = await api.patch(`/support/${ticket._id}/status`, { status });
      toast.success(`Status → ${status}`);
      onUpdated(data);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{ticket.category}</p>
          <h3 className="mt-0.5 text-base font-extrabold text-brand-ink">{ticket.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.cls}`}>{p.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.cls}`}>{STATUS[ticket.status]?.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_BADGE[ticket.createdBy?.role] || ""}`}>{ticket.createdBy?.role}</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Original message */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
              {(ticket.createdBy?.name || "U").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-ink">{ticket.createdBy?.name}</p>
              <p className="text-[10px] text-slate-400">{formatDate(ticket.createdAt)}</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
        </div>

        {/* Responses */}
        {ticket.responses?.map((r, i) => (
          <div key={i} className="rounded-xl border border-brand-primary/20 bg-brand-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink text-[10px] font-bold text-white">
                {(r.by?.name || "A").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-primary">{r.by?.name || "Admin"} <span className="text-slate-400 font-normal">(admin)</span></p>
                <p className="text-[10px] text-slate-400">{formatDate(r.at)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{r.message}</p>
          </div>
        ))}
      </div>

      {/* Reply form */}
      <div className="border-t border-slate-100 px-5 py-4">
        {/* Status changer */}
        <div className="mb-3 flex gap-1.5 flex-wrap">
          {Object.entries(STATUS).map(([key, val]) => (
            <button key={key} onClick={() => changeStatus(key)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border transition ${ticket.status === key ? val.cls + " border-transparent" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              {val.label}
            </button>
          ))}
        </div>

        <form onSubmit={submitReply} className="flex gap-2">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2}
            placeholder="Type your response…"
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-primary focus:bg-white focus:outline-none transition" />
          <button type="submit" disabled={saving || !reply.trim()}
            className="rounded-xl bg-brand-primary px-4 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-50 transition">
            {saving ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── Ticket row ──────────────────────────────────────────────────── */
const TicketRow = ({ ticket, active, onClick }) => {
  const p = PRIORITY[ticket.priority] || PRIORITY.medium;
  const s = STATUS[ticket.status] || STATUS.open;
  return (
    <button onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${active ? "border-brand-primary bg-brand-surface" : "border-slate-200/70 bg-white hover:bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${p.dot}`} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-ink">{ticket.title}</p>
            <p className="text-[11px] text-slate-500">{ticket.createdBy?.name} · {ticket.createdBy?.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${s.cls}`}>{s.label}</span>
          <span className="text-[9px] text-slate-400">{formatDate(ticket.createdAt)}</span>
        </div>
      </div>
      {ticket.responses?.length > 0 && (
        <p className="mt-1.5 ml-4 truncate text-[11px] text-slate-400">
          💬 {ticket.responses.length} response{ticket.responses.length > 1 ? "s" : ""}
        </p>
      )}
    </button>
  );
};

/* ── Main page ───────────────────────────────────────────────────── */
const AdminSupportPage = () => {
  const { data, loading, setData } = useFetch(() => api.get("/support"), []);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");

  const tickets = Array.isArray(data) ? data : [];

  const filtered = tickets.filter((t) => {
    const sOk = !statusFilter || t.status === statusFilter;
    const pOk = !priorityFilter || t.priority === priorityFilter;
    const qOk = !search || `${t.title} ${t.createdBy?.name} ${t.category}`.toLowerCase().includes(search.toLowerCase());
    return sOk && pOk && qOk;
  });

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
  };

  const handleUpdated = (updated) => {
    setData((prev) => (Array.isArray(prev) ? prev : []).map((t) => t._id === updated._id ? updated : t));
    setSelected(updated);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Support Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and respond to support tickets from all users.</p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Total", val: counts.total,      cls: "text-brand-primary bg-brand-surface border-brand-primary/20" },
            { label: "Open",  val: counts.open,        cls: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "Active",val: counts.inProgress,  cls: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "Urgent",val: counts.urgent,      cls: "text-rose-600 bg-rose-50 border-rose-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-4 py-2 text-center ${s.cls}`}>
              <p className="text-lg font-extrabold">{s.val}</p>
              <p className="text-[10px] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, user…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-brand-primary focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All Status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All Priority</option>
          {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Two-pane layout */}
      <div className={`grid gap-5 ${selected ? "xl:grid-cols-[1fr_500px]" : ""}`}>
        {/* Ticket list */}
        <div>
          {loading ? <Loader label="Loading tickets…" /> : !filtered.length ? (
            <EmptyState title="No tickets found" description="Adjust filters or wait for users to raise queries." />
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <TicketRow key={t._id} ticket={t} active={selected?._id === t._id}
                  onClick={() => setSelected(selected?._id === t._id ? null : t)} />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="sticky top-20 h-[calc(100vh-160px)]">
            <TicketPanel ticket={selected} onUpdated={handleUpdated} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportPage;
