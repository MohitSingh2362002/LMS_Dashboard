import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const STATUS_PILL = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700"
};

const StatCard = ({ label, value, icon, accent }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-brand-ink">{value}</p>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
    </div>
  </div>
);

// ── View Logs Modal ────────────────────────────────────────────────
const LogsModal = ({ migration, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-base font-bold text-brand-ink">Migration History</h3>
          <p className="text-xs text-slate-500">{migration.learner?.name || "Unknown"}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 space-y-4">
        {/* Timeline entry */}
        <div className="relative pl-6">
          <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-brand-primary ring-2 ring-white" />
          <div className="absolute left-1.5 top-4 bottom-0 w-px bg-slate-200" />
          <p className="text-xs font-bold text-brand-ink">Migration Request Submitted</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{formatDate(migration.createdAt)}</p>
          {migration.reason ? <p className="mt-1 text-xs text-slate-600 italic">"{migration.reason}"</p> : null}
        </div>

        {/* Batch details */}
        <div className="relative pl-6">
          <div className={`absolute left-0 top-1 h-3 w-3 rounded-full ring-2 ring-white ${migration.status === "approved" ? "bg-emerald-500" : migration.status === "rejected" ? "bg-rose-500" : "bg-amber-400"}`} />
          <p className="text-xs font-bold text-brand-ink capitalize">{migration.status}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {migration.fromBatch?.name || "—"} → {migration.toBatch?.name || "—"}
          </p>
          {migration.reviewedAt ? <p className="mt-0.5 text-[11px] text-slate-400">Reviewed: {formatDate(migration.reviewedAt)}</p> : null}
          {migration.reviewedBy?.name ? <p className="text-[11px] text-slate-400">By: {migration.reviewedBy.name}</p> : null}
        </div>
      </div>
    </div>
  </div>
);

const AdminMigrationRequestsPage = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [logsModal, setLogsModal] = useState(null);

  const { data: migrations, loading, refresh } = useFetch(
    () => api.get(statusFilter ? `/batches/migrations?status=${statusFilter}` : "/batches/migrations"),
    [statusFilter]
  );
  const { data: allMigrations, loading: la, refresh: refreshAll } = useFetch(() => api.get("/batches/migrations"), []);
  const { data: batches, loading: lb } = useFetch(() => api.get("/batches"), []);

  const counts = useMemo(() => ({
    pending: allMigrations.filter((i) => i.status === "pending").length,
    approved: allMigrations.filter((i) => i.status === "approved").length,
    rejected: allMigrations.filter((i) => i.status === "rejected").length
  }), [allMigrations]);

  const reviewMigration = async (id, status) => {
    try {
      await api.put(`/batches/migrations/${id}/review`, { status });
      toast.success(`Migration ${status}`);
      refresh(); refreshAll();
    } catch (e) { toast.error(e.response?.data?.message || "Review failed"); }
  };

  if (loading || la || lb) return <Loader label="Loading migrations..." />;

  const list = Array.isArray(migrations) ? migrations : [];
  const total = counts.pending + counts.approved + counts.rejected;
  // Health = approved / (approved + rejected), only count reviewed
  const reviewed = counts.approved + counts.rejected;
  const health = reviewed > 0 ? Math.round((counts.approved / reviewed) * 100) : null;

  // Real batch lookup data
  const batchArr = Array.isArray(batches) ? batches : [];

  return (
    <div className="space-y-6">
      {/* Logs Modal */}
      {logsModal ? <LogsModal migration={logsModal} onClose={() => setLogsModal(null)} /> : null}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Admin / User Management</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-ink">Migration Command Center</h1>
            <span className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-bold uppercase text-brand-primary">System v2.4</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={counts.pending} accent="bg-amber-100 text-amber-700"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>} />
        <StatCard label="Approved" value={counts.approved} accent="bg-emerald-100 text-emerald-700"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4l-10 10-3-3" /></svg>} />
        <StatCard label="Rejected" value={counts.rejected} accent="bg-rose-100 text-rose-700"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>} />
        <div className="rounded-2xl bg-brand-ink p-5 text-white shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Approval Rate</p>
          {health !== null ? (
            <>
              <p className="mt-1 text-3xl font-bold">{health}%</p>
              <p className="mt-1 text-[10px] text-white/50">of {reviewed} reviewed requests</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold">—</p>
              <p className="mt-1 text-[10px] text-white/50">No reviewed requests yet</p>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-brand-ink">
            {statusFilter === "pending" ? "Pending Requests" : statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests` : "All Requests"}
            <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{list.length}</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium capitalize">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>
        </div>

        {!list.length ? (
          <div className="p-8"><EmptyState title="No requests" description="Migration requests will appear here." /></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((r) => (
              <div key={r._id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-surface text-xs font-bold text-brand-primary">
                    {r.learner?.name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{r.learner?.name || "Unknown"}</p>
                    <p className="text-[11px] text-slate-500">ID: {r.learner?._id?.slice(-8).toUpperCase() || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <p className="text-[9px] font-semibold uppercase text-slate-400">Current</p>
                    <span className="mt-0.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{r.fromBatch?.name || "—"}</span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-slate-400"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  <div className="text-center">
                    <p className="text-[9px] font-semibold uppercase text-slate-400">Migrated To</p>
                    <span className="mt-0.5 inline-block rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{r.toBatch?.name || "—"}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <p className="text-[9px] font-semibold uppercase text-slate-400">Reason</p>
                  <p className="text-xs text-brand-ink">{r.reason || "—"}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_PILL[r.status] || "bg-slate-100 text-slate-600"}`}>
                    {r.status}
                  </span>
                  <p className="text-[10px] text-slate-400">{formatDate(r.createdAt)}</p>
                </div>

                {r.status === "pending" ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => reviewMigration(r._id, "approved")}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Approve
                    </button>
                    <button onClick={() => reviewMigration(r._id, "rejected")}
                      className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                      Reject
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setLogsModal(r)}
                    className="text-xs font-semibold text-brand-primary hover:underline">
                    View Logs
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          {total} total requests · {counts.pending} pending review
        </div>
      </div>

      {/* Quick Batch Lookup — real data */}
      <div className="max-w-md rounded-2xl bg-brand-ink p-5 text-white shadow-card">
        <h3 className="text-sm font-semibold">Quick Batch Lookup</h3>
        {!batchArr.length ? (
          <p className="mt-3 text-xs text-white/50">No batches available.</p>
        ) : (
          <div className="mt-3 space-y-2 text-xs">
            {batchArr.slice(0, 6).map((b) => {
              const learnerCount = b.learners?.length ?? 0;
              const GROUP_COLOR = {
                foundation: "bg-slate-400",
                growth: "bg-amber-500",
                merit: "bg-emerald-500",
                ranker: "bg-brand-primary"
              };
              const tone = GROUP_COLOR[b.performanceGroup] || "bg-slate-400";
              return (
                <div key={b._id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span className="font-medium">{b.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/50">{learnerCount} learner{learnerCount !== 1 ? "s" : ""}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${tone}`}>{b.performanceGroup || "active"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMigrationRequestsPage;
