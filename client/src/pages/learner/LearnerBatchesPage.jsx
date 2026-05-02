import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const LearnerBatchesPage = () => {
  const { data: batches, loading } = useFetch(() => api.get("/batches/mine"), []);

  if (loading) return <Loader label="Loading your batch..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">My Batch</p>
        <h2 className="font-display text-3xl text-slate-900">Batch & Mentor</h2>
        <p className="mt-2 text-sm text-slate-500">
          See your assigned batch, course, mentor, and learning group.
        </p>
      </div>

      {!batches.length ? (
        <EmptyState title="No batch assigned yet" description="Your batch will appear here once an admin adds you to one." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <article key={batch._id} className="rounded-[28px] bg-white p-6 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl text-slate-900">{batch.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{batch.course?.title}</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold capitalize text-teal-700">
                  {batch.performanceGroup}
                </span>
              </div>

              <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mentor</p>
                <p className="mt-2 font-semibold text-slate-900">{batch.mentor?.name || "Unassigned"}</p>
                <p className="mt-1 text-sm text-slate-500">{batch.mentor?.email}</p>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Classmates</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {batch.learners?.map((learner) => (
                    <span key={learner._id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {learner.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-400">
                Updated {formatDate(batch.updatedAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerBatchesPage;
