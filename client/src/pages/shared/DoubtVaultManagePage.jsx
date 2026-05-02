import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate, getFullFileUrl } from "../../utils/helpers";

const statusClassNames = {
  pending: "bg-amber-100 text-amber-700",
  answered: "bg-emerald-100 text-emerald-700",
  reopened: "bg-rose-100 text-rose-700"
};

const DoubtVaultManagePage = () => {
  const [status, setStatus] = useState("");
  const [answers, setAnswers] = useState({});
  const { data: doubts, loading, refresh } = useFetch(
    () => api.get(status ? `/doubts?status=${status}` : "/doubts"),
    [status]
  );

  const answerDoubt = async (id) => {
    try {
      await api.put(`/doubts/${id}/answer`, { answer: answers[id] || "" });
      toast.success("Doubt answered");
      setAnswers({ ...answers, [id]: "" });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to answer doubt");
    }
  };

  if (loading) return <Loader label="Loading Doubt Vault..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Doubt Vault</p>
          <h2 className="font-display text-3xl text-slate-900">Problem Resolution</h2>
          <p className="mt-2 text-sm text-slate-500">Respond to learner text and audio doubts assigned through courses or batches.</p>
        </div>
        <select className="rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="reopened">Reopened</option>
          <option value="answered">Answered</option>
        </select>
      </div>

      {!doubts.length ? (
        <EmptyState title="No doubts found" description="Learner doubts matching this filter will appear here." />
      ) : (
        <div className="space-y-4">
          {doubts.map((doubt) => (
            <article key={doubt._id} className="rounded-[28px] bg-white p-6 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {doubt.learner?.name} · {doubt.course?.title || "General"} · {doubt.batch?.name || "No batch"}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{doubt.question}</h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {[doubt.subject, doubt.chapter, doubt.topic].filter(Boolean).join(" · ") || "Untagged"} · {formatDate(doubt.createdAt)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClassNames[doubt.status] || "bg-slate-100 text-slate-600"}`}>
                  {doubt.status}
                </span>
              </div>

              {doubt.audio?.path ? (
                <audio className="mt-4 w-full" controls src={getFullFileUrl(doubt.audio.path)} />
              ) : null}

              {doubt.status === "answered" ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p>{doubt.answer}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Answered by {doubt.answeredBy?.name || "Teacher"} {doubt.answeredAt ? `· ${formatDate(doubt.answeredAt)}` : ""}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <textarea
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                    rows="4"
                    placeholder="Type resolution"
                    value={answers[doubt._id] || ""}
                    onChange={(event) => setAnswers({ ...answers, [doubt._id]: event.target.value })}
                  />
                  <div className="flex justify-end">
                    <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white" onClick={() => answerDoubt(doubt._id)}>
                      Mark Answered
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoubtVaultManagePage;
