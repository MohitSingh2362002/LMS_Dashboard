import { useMemo, useState } from "react";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { LearnerPageTitle, LearnerStatCard } from "../../components/learner/LearnerPortalUI";

const AttendanceViewPage = () => {
  const { data: attendance, loading } = useFetch(() => api.get("/attendance"), []);
  const latestDate = attendance[0]?.sessionDate ? new Date(attendance[0].sessionDate) : new Date();
  const [monthDate, setMonthDate] = useState(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1));

  const records = useMemo(() => {
    return attendance.flatMap((session) =>
      session.records.map((record) => ({
        id: `${session._id}-${record.learner?._id || record.learner}`,
        date: new Date(session.sessionDate),
        status: record.status,
        note: record.note,
        batch: session.batch,
        course: session.course,
        learner: record.learner,
      }))
    );
  }, [attendance]);

  const stats = useMemo(() => {
    const present = records.filter((item) => item.status === "present").length;
    const late = records.filter((item) => item.status === "late").length;
    const absent = records.filter((item) => item.status === "absent").length;
    const total = records.length;
    const rate = total ? Math.round(((present + late) / total) * 1000) / 10 : 0;
    return { total, present: present + late, absent, rate };
  }, [records]);

  const monthRecords = useMemo(() => {
    const map = new Map();
    records.forEach((item) => {
      if (item.date.getMonth() === monthDate.getMonth() && item.date.getFullYear() === monthDate.getFullYear()) {
        map.set(item.date.getDate(), item);
      }
    });
    return map;
  }, [records, monthDate]);

  const days = useMemo(() => buildCalendar(monthDate), [monthDate]);

  if (loading) return <Loader label="Loading attendance..." />;

  return (
    <div className="space-y-8">
      <LearnerPageTitle title="Attendance History" subtitle="Track your daily class attendance and participation records across all enrolled courses." />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <LearnerStatCard label="Total Classes" value={stats.total} />
        <LearnerStatCard label="Present" value={stats.present} tone="green" />
        <LearnerStatCard label="Absent" value={stats.absent} tone="red" />
        <LearnerStatCard label="Attendance Rate" value={`${stats.rate}%`} />
      </div>

      {!attendance.length ? (
        <EmptyState title="No attendance records" description="Attendance will appear once a teacher marks it." />
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 p-8">
            <div className="flex items-center gap-8">
              <h3 className="text-3xl font-medium text-brand-primary">
                {monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-4">
                <button className="text-3xl" type="button" onClick={() => setMonthDate(addMonths(monthDate, -1))}>‹</button>
                <button className="text-3xl" type="button" onClick={() => setMonthDate(addMonths(monthDate, 1))}>›</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <Legend color="bg-emerald-100 border-emerald-500" label="Present" />
              <Legend color="bg-red-100 border-red-500" label="Absent" />
              <Legend color="bg-orange-100 border-orange-500" label="Late" />
              <Legend color="bg-slate-200 border-slate-400" label="Holiday" />
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-300 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="border-r border-slate-300 py-5 text-sm last:border-r-0">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const record = day.inMonth ? monthRecords.get(day.date.getDate()) : null;
              const weekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              const status = record?.status || (weekend && day.inMonth ? "holiday" : "");
              return (
                <div key={`${day.date.toISOString()}-${index}`} className={`min-h-36 border-r border-t border-slate-300 p-5 last:border-r-0 ${cellClass(status)} ${!day.inMonth ? "bg-white text-slate-400" : ""}`}>
                  <p className="text-base">{day.date.getDate()}</p>
                  {day.inMonth && status ? <p className={`mt-3 text-xs font-bold uppercase ${statusTextClass(status)}`}>{status}</p> : null}
                  {record?.batch?.name ? <p className="mt-4 text-xs text-slate-600">{record.batch.name}</p> : null}
                  {record?.course?.title ? <p className="mt-1 text-xs text-slate-600">{record.course.title}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="text-center text-sm text-slate-600">Showing attendance data for the current academic session.</p>
    </div>
  );
};

const buildCalendar = (monthDate) => {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const days = [];
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - cursor.getDay());
  while (days.length < 35 || cursor <= end) {
    days.push({ date: new Date(cursor), inMonth: cursor.getMonth() === monthDate.getMonth() });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days.slice(0, 35);
};

const addMonths = (date, count) => new Date(date.getFullYear(), date.getMonth() + count, 1);
const Legend = ({ color, label }) => <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full border ${color}`} />{label}</span>;
const cellClass = (status) => status === "present" ? "bg-emerald-50" : status === "absent" ? "bg-red-50" : status === "late" ? "bg-orange-50" : status === "holiday" ? "bg-slate-100" : "bg-white";
const statusTextClass = (status) => status === "present" ? "text-emerald-700" : status === "absent" ? "text-red-700" : status === "late" ? "text-orange-700" : "text-slate-700";

export default AttendanceViewPage;
