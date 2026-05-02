import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const InstructorBatchesPage = () => {
  const { data: batches, loading } = useFetch(() => api.get("/batches"), []);

  if (loading) return <Loader label="Loading mentor batches..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Mentor Workspace</p>
        <h2 className="font-display text-3xl text-slate-900">My Batches</h2>
        <p className="mt-2 text-sm text-slate-500">View assigned batches, learners, courses, and performance groups.</p>
      </div>

      {!batches.length ? (
        <EmptyState title="No batches assigned" description="Admin-created batches assigned to you will appear here." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <article key={batch._id} className="rounded-[28px] bg-white p-6 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl text-slate-900">{batch.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{batch.course?.title}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {batch.performanceGroup}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Learners</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {batch.learners?.map((learner) => (
                    <span key={learner._id} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                      {learner.name}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorBatchesPage;
