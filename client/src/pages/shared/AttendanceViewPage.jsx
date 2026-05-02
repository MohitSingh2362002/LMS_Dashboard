import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const AttendanceViewPage = () => {
  const { data: attendance, loading } = useFetch(() => api.get("/attendance"), []);

  if (loading) return <Loader label="Loading attendance..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Attendance</p>
        <h2 className="font-display text-3xl text-slate-900">Attendance History</h2>
        <p className="mt-2 text-sm text-slate-500">Review attendance records and automated alerts.</p>
      </div>

      {!attendance.length ? (
        <EmptyState title="No attendance records" description="Attendance will appear once a teacher marks it." />
      ) : (
        <div className="space-y-4">
          {attendance.map((item) => (
            <article key={item._id} className="rounded-[28px] bg-white p-6 shadow-panel">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.batch?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(item.sessionDate)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {item.records.length} records
                </span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {item.records.map((record) => (
                  <div key={record.learner?._id || record.learner} className="rounded-2xl border border-slate-100 p-4">
                    <p className="font-medium text-slate-900">{record.learner?.name}</p>
                    <p className="mt-1 text-sm capitalize text-slate-500">{record.status}</p>
                    {record.note ? <p className="mt-2 text-sm text-slate-600">{record.note}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceViewPage;
