import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const InstructorMigrationRequestsPage = () => {
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);
  const { data: migrations, loading: loadingMigrations, refresh } = useFetch(
    () => api.get("/batches/migrations"),
    []
  );
  const [requestForm, setRequestForm] = useState({
    learner: "",
    fromBatch: "",
    toBatch: "",
    reason: ""
  });

  const sourceBatch = useMemo(
    () => batches.find((batch) => batch._id === requestForm.fromBatch),
    [batches, requestForm.fromBatch]
  );

  const requestMigration = async (event) => {
    event.preventDefault();
    try {
      await api.post("/batches/migrations", requestForm);
      toast.success("Migration request sent");
      setRequestForm({ learner: "", fromBatch: "", toBatch: "", reason: "" });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to request migration");
    }
  };

  if (loadingBatches || loadingMigrations) return <Loader label="Loading migration requests..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Mentor Workspace</p>
        <h2 className="font-display text-3xl text-slate-900">Migration Requests</h2>
        <p className="mt-2 text-sm text-slate-500">Request learner movement between batches and track approval status.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
        <form onSubmit={requestMigration} className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">New Request</h3>
          <div className="mt-5 space-y-4">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={requestForm.fromBatch} onChange={(event) => setRequestForm({ ...requestForm, fromBatch: event.target.value, learner: "" })} required>
              <option value="">Current batch</option>
              {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={requestForm.learner} onChange={(event) => setRequestForm({ ...requestForm, learner: event.target.value })} required>
              <option value="">Learner</option>
              {(sourceBatch?.learners || []).map((learner) => <option key={learner._id} value={learner._id}>{learner.name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={requestForm.toBatch} onChange={(event) => setRequestForm({ ...requestForm, toBatch: event.target.value })} required>
              <option value="">Target batch</option>
              {batches.filter((batch) => batch._id !== requestForm.fromBatch).map((batch) => (
                <option key={batch._id} value={batch._id}>{batch.name}</option>
              ))}
            </select>
            <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows="4" placeholder="Reason for movement" value={requestForm.reason} onChange={(event) => setRequestForm({ ...requestForm, reason: event.target.value })} />
          </div>
          <button className="mt-5 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            Send for Admin Approval
          </button>
        </form>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Request History</h3>
          <div className="mt-5 space-y-4">
            {migrations.map((request) => (
              <div key={request._id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 p-5">
                <div>
                  <p className="font-semibold text-slate-900">{request.learner?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{request.fromBatch?.name} to {request.toBatch?.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{formatDate(request.createdAt)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {request.status}
                </span>
              </div>
            ))}
            {!migrations.length ? <EmptyState title="No requests yet" description="Migration requests you create will appear here." /> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InstructorMigrationRequestsPage;
