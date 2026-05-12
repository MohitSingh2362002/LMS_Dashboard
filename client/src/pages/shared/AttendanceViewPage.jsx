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
    <div className="space-y-5 sm:space-y-8">
      <LearnerPageTitle title="Attendance History" subtitle="Track your daily class attendance and participation records across all enrolled courses." />

      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:px-0 md:grid-cols-2 xl:grid-cols-4">
        <LearnerStatCard label="Total Classes" value={stats.total} />
        <LearnerStatCard label="Present" value={stats.present} tone="green" />
        <LearnerStatCard label="Absent" value={stats.absent} tone="red" />
        <LearnerStatCard label="Attendance Rate" value={`${stats.rate}%`} />
      </div>

      {!attendance.length ? (
        <EmptyState title="No attendance records" description="Attendance will appear once a teacher marks it." />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card sm:rounded-lg sm:border-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 sm:gap-4 sm:border-slate-300 sm:p-8">
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start sm:gap-8">
              <h3 className="text-lg font-bold text-brand-primary sm:text-3xl sm:font-medium">
                {monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2 sm:gap-4">
                <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-2xl sm:bg-transparent sm:text-3xl" type="button" onClick={() => setMonthDate(addMonths(monthDate, -1))}>‹</button>
                <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-2xl sm:bg-transparent sm:text-3xl" type="button" onClick={() => setMonthDate(addMonths(monthDate, 1))}>›</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] sm:gap-5 sm:text-sm">
              <Legend color="bg-emerald-100 border-emerald-500" label="Present" />
              <Legend color="bg-red-100 border-red-500" label="Absent" />
              <Legend color="bg-orange-100 border-orange-500" label="Late" />
              <Legend color="bg-slate-200 border-slate-400" label="Holiday" />
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-200 text-center sm:border-slate-300">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="border-r border-slate-200 py-2 text-[10px] font-bold text-slate-500 last:border-r-0 sm:border-slate-300 sm:py-5 sm:text-sm sm:font-normal">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const record = day.inMonth ? monthRecords.get(day.date.getDate()) : null;
              const weekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              const status = record?.status || (weekend && day.inMonth ? "holiday" : "");
              return (
                <div key={`${day.date.toISOString()}-${index}`} className={`min-h-14 border-r border-t border-slate-200 p-1.5 last:border-r-0 sm:min-h-36 sm:border-slate-300 sm:p-5 ${cellClass(status)} ${!day.inMonth ? "bg-white text-slate-400" : ""}`}>
                  <p className="text-xs font-semibold sm:text-base sm:font-normal">{day.date.getDate()}</p>
                  {day.inMonth && status ? <p className={`mt-1 truncate text-[8px] font-bold uppercase sm:mt-3 sm:text-xs ${statusTextClass(status)}`}>{status}</p> : null}
                  {record?.batch?.name ? <p className="mt-1 hidden text-xs text-slate-600 sm:mt-4 sm:block">{record.batch.name}</p> : null}
                  {record?.course?.title ? <p className="mt-1 hidden text-xs text-slate-600 sm:block">{record.course.title}</p> : null}
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
