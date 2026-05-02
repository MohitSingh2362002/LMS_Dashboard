import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const todayValue = () => new Date().toISOString().slice(0, 10);

const AttendanceMarkPage = () => {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [sessionDate, setSessionDate] = useState(todayValue());
  const [records, setRecords] = useState({});
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);
  const { data: attendance, loading: loadingAttendance, refresh } = useFetch(() => api.get("/attendance"), []);

  const batch = useMemo(() => batches.find((item) => item._id === selectedBatch), [batches, selectedBatch]);

  useEffect(() => {
    if (!batch) return;
    setRecords(
      Object.fromEntries(
        (batch.learners || []).map((learner) => [learner._id, { learner: learner._id, status: "present", note: "" }])
      )
    );
  }, [batch]);

  const updateRecord = (learnerId, patch) => {
    setRecords({
      ...records,
      [learnerId]: { ...(records[learnerId] || { learner: learnerId }), ...patch }
    });
  };

  const submitAttendance = async (event) => {
    event.preventDefault();
    try {
      await api.post("/attendance", {
        batch: selectedBatch,
        sessionDate,
        records: Object.values(records)
      });
      toast.success("Attendance marked and alerts sent");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to mark attendance");
    }
  };

  if (loadingBatches || loadingAttendance) return <Loader label="Loading attendance..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Attendance</p>
        <h2 className="font-display text-3xl text-slate-900">Mark Attendance</h2>
        <p className="mt-2 text-sm text-slate-500">Mark batch attendance and send automated alerts to learners and linked parents.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <form onSubmit={submitAttendance} className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Session</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} required>
              <option value="">Select batch</option>
              {batches.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} required />
          </div>

          {!batch ? (
            <div className="mt-5"><EmptyState title="Choose a batch" description="Learners in the batch will appear here." /></div>
          ) : (
            <div className="mt-5 space-y-3">
              {batch.learners?.map((learner) => (
                <div key={learner._id} className="rounded-3xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{learner.name}</p>
                      <p className="text-sm text-slate-500">{learner.email}</p>
                    </div>
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={records[learner._id]?.status || "present"} onChange={(event) => updateRecord(learner._id, { status: event.target.value })}>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                  <input className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Optional note" value={records[learner._id]?.note || ""} onChange={(event) => updateRecord(learner._id, { note: event.target.value })} />
                </div>
              ))}
              <button className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
                Save Attendance
              </button>
            </div>
          )}
        </form>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Recent Attendance</h3>
          <div className="mt-5 space-y-4">
            {attendance.slice(0, 8).map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{item.batch?.name}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(item.sessionDate)} · Marked by {item.markedBy?.name}</p>
                <p className="mt-3 text-sm text-slate-600">
                  {item.records.filter((record) => record.status === "present").length} present · {item.records.filter((record) => record.status === "absent").length} absent · {item.records.filter((record) => record.status === "late").length} late
                </p>
              </div>
            ))}
            {!attendance.length ? <EmptyState title="No attendance yet" description="Saved attendance sessions will appear here." /> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AttendanceMarkPage;
