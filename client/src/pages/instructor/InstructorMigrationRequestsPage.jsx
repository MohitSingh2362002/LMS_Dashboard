import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const STATUS_PILL = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const StatCard = ({ label, value, color }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card text-center">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <p className={`mt-2 text-3xl font-bold ${color}`}>{String(value).padStart(2, "0")}</p>
  </div>
);

const InstructorMigrationRequestsPage = () => {
  const { data: batches,    loading: lb } = useFetch(() => api.get("/batches"), []);
  const { data: migrations, loading: lm, refresh } = useFetch(() => api.get("/batches/migrations"), []);

  const [form, setForm] = useState({ fromBatch: "", learner: "", toBatch: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const batchArr = Array.isArray(batches)    ? batches    : [];
  const migArr   = Array.isArray(migrations) ? migrations : [];

  const sourceBatch = useMemo(
    () => batchArr.find((b) => b._id === form.fromBatch),
    [batchArr, form.fromBatch]
  );

  const counts = useMemo(() => ({
    total:    migArr.length,
    pending:  migArr.filter((m) => m.status === "pending").length,
    rejected: migArr.filter((m) => m.status === "rejected").length,
  }), [migArr]);

  const filteredMig = useMemo(
    () => statusFilter ? migArr.filter((m) => m.status === statusFilter) : migArr,
    [migArr, statusFilter]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromBatch || !form.learner || !form.toBatch) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/batches/migrations", form);
      toast.success("Migration request submitted for admin review");
      setForm({ fromBatch: "", learner: "", toBatch: "", reason: "" });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (lb || lm) return <Loader label="Loading migration requests..." />;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <p className="text-xs text-slate-400">Dashboard › Migrations</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-ink">Student Migration Request</h1>
        <p className="mt-1 text-sm text-slate-500">Move learners between batches with administrative oversight.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.4fr]">
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card space-y-5">
          {/* Form title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-brand-ink">New Migration Request</h2>
          </div>

          {/* Current Batch */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Current Batch</label>
            <div className="relative">
              <select
                value={form.fromBatch}
                onChange={(e) => setForm({ ...form, fromBatch: e.target.value, learner: "" })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
                required
              >
                <option value="">Select Current Batch</option>
                {batchArr.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Learner */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Learner</label>
            <div className="relative">
              <select
                value={form.learner}
                onChange={(e) => setForm({ ...form, learner: e.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
                required
                disabled={!form.fromBatch}
              >
                <option value="">Search and Select Student</option>
                {(sourceBatch?.learners || []).map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {!form.fromBatch && (
              <p className="mt-1 text-[11px] text-slate-400">Select a current batch first to load learners.</p>
            )}
          </div>

          {/* Target Batch */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Target Batch</label>
            <div className="relative">
              <select
                value={form.toBatch}
                onChange={(e) => setForm({ ...form, toBatch: e.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
                required
              >
                <option value="">Select Target Batch</option>
                {batchArr.filter((b) => b._id !== form.fromBatch).map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason for movement</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={4}
              placeholder="Briefly explain the pedagogical or administrative reason for this transfer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cta py-3 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>

        {/* ── Right: Stats + History ── */}
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Requests" value={counts.total}    color="text-brand-primary" />
            <StatCard label="Pending"         value={counts.pending}  color="text-amber-600" />
            <StatCard label="Rejected"        value={counts.rejected} color="text-rose-600" />
          </div>

          {/* Request History */}
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-bold text-brand-ink">Request History</h3>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-slate-400">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="10" y2="18" />
                </svg>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr,1fr,auto,auto] gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Learner</span>
              <span>Migration Path</span>
              <span>Date</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {filteredMig.map((m) => (
                <div key={m._id} className="grid grid-cols-[1fr,1fr,auto,auto] items-center gap-3 px-5 py-4 hover:bg-slate-50/50">
                  {/* Learner */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-surface text-[11px] font-bold text-brand-primary">
                      {(m.learner?.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-ink leading-tight">{m.learner?.name || "Unknown"}</p>
                      <p className="text-[10px] text-slate-400">ID·{m.learner?._id?.slice(-4).toUpperCase() || "—"}</p>
                    </div>
                  </div>

                  {/* Path */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium text-slate-600">{m.fromBatch?.name || "—"}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-slate-400 shrink-0">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className="font-bold text-brand-primary">{m.toBatch?.name || "—"}</span>
                  </div>

                  {/* Date */}
                  <div className="text-[11px] text-slate-500 whitespace-nowrap">
                    {formatDate(m.createdAt)}
                  </div>

                  {/* Status */}
                  <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_PILL[m.status] || "bg-slate-100 text-slate-600"}`}>
                    {m.status}
                  </span>
                </div>
              ))}

              {!filteredMig.length && (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  {statusFilter ? `No ${statusFilter} requests.` : "No migration requests yet."}
                </div>
              )}
            </div>

            {migArr.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <button
                  onClick={() => setStatusFilter("")}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  View All Requests
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorMigrationRequestsPage;
