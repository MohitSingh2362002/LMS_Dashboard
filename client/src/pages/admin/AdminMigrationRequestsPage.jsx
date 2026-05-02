import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const statusClassNames = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700"
};

const AdminMigrationRequestsPage = () => {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: migrations, loading, refresh } = useFetch(
    () => api.get(statusFilter ? `/batches/migrations?status=${statusFilter}` : "/batches/migrations"),
    [statusFilter]
  );
  const { data: allMigrations, loading: loadingAllMigrations, refresh: refreshAllMigrations } = useFetch(
    () => api.get("/batches/migrations"),
    []
  );

  const counts = useMemo(
    () => ({
      pending: allMigrations.filter((item) => item.status === "pending").length,
      approved: allMigrations.filter((item) => item.status === "approved").length,
      rejected: allMigrations.filter((item) => item.status === "rejected").length
    }),
    [allMigrations]
  );

  const reviewMigration = async (id, status) => {
    try {
      await api.put(`/batches/migrations/${id}/review`, { status });
      toast.success(`Migration ${status}`);
      refresh();
      refreshAllMigrations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to review migration");
    }
  };

  if (loading || loadingAllMigrations) return <Loader label="Loading migration requests..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Command Center</p>
          <h2 className="font-display text-3xl text-slate-900">Migration Requests</h2>
          <p className="mt-2 text-sm text-slate-500">Approve or reject teacher-requested learner batch movement.</p>
        </div>
        <select className="rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {["pending", "approved", "rejected"].map((status) => (
          <div key={status} className="rounded-[24px] bg-white p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{status}</p>
            <p className="mt-2 font-display text-3xl text-slate-900">{counts[status]}</p>
          </div>
        ))}
      </div>

      {!migrations.length ? (
        <EmptyState title="No migration requests" description="Requests from mentors will appear here." />
      ) : (
        <div className="space-y-4">
          {migrations.map((request) => (
            <div key={request._id} className="rounded-[28px] bg-white p-6 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{request.learner?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.fromBatch?.name} to {request.toBatch?.name} · Requested by {request.requestedBy?.name}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {formatDate(request.createdAt)}
                    {request.reviewedAt ? ` · Reviewed ${formatDate(request.reviewedAt)}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClassNames[request.status] || "bg-slate-100 text-slate-600"}`}>
                  {request.status}
                </span>
              </div>
              {request.reason ? <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{request.reason}</p> : null}
              {request.status === "pending" ? (
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white" onClick={() => reviewMigration(request._id, "approved")}>
                    Approve
                  </button>
                  <button className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-medium text-rose-600" onClick={() => reviewMigration(request._id, "rejected")}>
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMigrationRequestsPage;
