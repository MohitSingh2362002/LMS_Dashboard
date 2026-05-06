import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const todayValue = () => new Date().toISOString().slice(0, 10);

const STATUS_MAP = {
  present: { label: "Present", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-100" },
  absent: { label: "Absent", color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-100" },
  late: { label: "Late", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-100" }
};

const SessionCard = ({ session }) => {
  const present = session.records?.filter((r) => r.status === "present").length ?? 0;
  const absent = session.records?.filter((r) => r.status === "absent").length ?? 0;
  const late = session.records?.filter((r) => r.status === "late").length ?? 0;
  const total = present + absent + late;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-brand-ink">{session.batch?.name || "—"}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {formatDate(session.sessionDate)} · {session.markedBy?.name || "System"}
          </p>
        </div>
        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">Completed</span>
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <div>
          <span className="font-bold text-emerald-600">{present}</span>
          <span className="ml-1 text-slate-500">Present</span>
        </div>
        <div>
          <span className="font-bold text-rose-600">{absent < 10 ? `0${absent}` : absent}</span>
          <span className="ml-1 text-slate-500">Absent</span>
        </div>
        <div>
          <span className="font-bold text-amber-600">{late < 10 ? `0${late}` : late}</span>
          <span className="ml-1 text-slate-500">Late</span>
        </div>
      </div>
      {total > 0 ? (
        <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-emerald-500" style={{ width: `${(present / total) * 100}%` }} />
          <div className="bg-rose-500" style={{ width: `${(absent / total) * 100}%` }} />
          <div className="bg-amber-500" style={{ width: `${(late / total) * 100}%` }} />
        </div>
      ) : null}
      {session.markedBy?.name ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></svg>
          Marked by {session.markedBy.name}
        </p>
      ) : null}
    </div>
  );
};

const AttendanceMarkPage = () => {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [sessionDate, setSessionDate] = useState(todayValue());
  const [records, setRecords] = useState({});

  const { data: batches, loading: lb } = useFetch(() => api.get("/batches"), []);
  const { data: attendance, loading: la, refresh } = useFetch(() => api.get("/attendance"), []);
  const { data: weeklyData } = useFetch(() => api.get("/analytics/weekly-attendance"), []);

  const batch = useMemo(() => batches.find((b) => b._id === selectedBatch), [batches, selectedBatch]);

  useEffect(() => {
    if (!batch) return;
    setRecords(
      Object.fromEntries(
        (batch.learners || []).map((l) => [l._id, { learner: l._id, status: "present", note: "" }])
      )
    );
  }, [batch]);

  const updateRecord = (id, patch) =>
    setRecords((prev) => ({ ...prev, [id]: { ...(prev[id] || { learner: id }), ...patch } }));

  const submitAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/attendance", { batch: selectedBatch, sessionDate, records: Object.values(records) });
      toast.success("Attendance saved & alerts sent");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  if (lb || la) return <Loader label="Loading attendance..." />;

  const recent = Array.isArray(attendance) ? attendance.slice(0, 6) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Institutional Dashboard</p>
          <h1 className="text-2xl font-bold text-brand-ink">Attendance Management</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage student presence across all active academic batches for the current semester.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        {/* Mark form */}
        <form onSubmit={submitAttendance} className="h-fit rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-surface">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1A4FA0" strokeWidth="2" className="h-4 w-4"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-base font-bold text-brand-ink">Mark New Attendance</h3>
            <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">Session Flow</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Academic Batch</label>
              <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="">Choose a batch</option>
                {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Session Date</label>
              <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </div>
          </div>

          {!batch ? (
            <div className="mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="mb-3 h-10 w-10">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <p className="text-sm font-semibold text-slate-500">Select a Batch to Start</p>
              <p className="mt-1 text-xs text-slate-400">Once a batch is selected, the student roster will appear here for marking presence.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {batch.learners?.map((l) => {
                const status = records[l._id]?.status || "present";
                return (
                  <div key={l._id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-surface text-xs font-bold text-brand-primary">
                      {l.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-brand-ink">{l.name}</p>
                      <p className="truncate text-[10px] text-slate-500">{l.email}</p>
                    </div>
                    <div className="flex gap-1">
                      {["present", "absent", "late"].map((s) => {
                        const st = STATUS_MAP[s];
                        return (
                          <button key={s} type="button" onClick={() => updateRecord(l._id, { status: s })}
                            className={`rounded-md px-2 py-1 text-[10px] font-bold capitalize transition ${status === s ? `${st.bg} ${st.text}` : "bg-slate-100 text-slate-400"
                              }`}>
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!batch.learners?.length ? <p className="py-4 text-center text-xs text-slate-500">No learners in this batch.</p> : null}
            </div>
          )}

          <button type="submit" disabled={!batch}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition disabled:cursor-not-allowed enabled:bg-brand-primary enabled:text-white enabled:hover:brightness-110">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Initialize Student Roster
          </button>
        </form>

        {/* Recent Sessions */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-brand-ink">Recent Sessions</h3>
          </div>

          {!recent.length ? (
            <EmptyState title="No sessions yet" description="Marked attendance sessions will appear here." />
          ) : (
            <div className="space-y-3">
              {recent.map((s) => <SessionCard key={s._id} session={s} />)}
            </div>
          )}

        </section>
      </div>
    </div>
  );
};

export default AttendanceMarkPage;
