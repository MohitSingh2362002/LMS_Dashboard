import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import LiveClassModal from "../../components/LiveClassModal";
import { formatDate } from "../../utils/helpers";
import { buildLiveClassJoinUrl } from "../../utils/liveClass";
import { useAuth } from "../../context/AuthContext";

const STATUS_BADGE = {
  live: { label: "● LIVE", cls: "bg-rose-500 text-white" },
  scheduled: { label: "UPCOMING", cls: "bg-brand-surface text-brand-primary" },
  ended: { label: "ENDED", cls: "bg-slate-200 text-slate-600" }
};

const TAB_FILTERS = ["All Scheduled", "Today's List", "Upcoming Week"];

// ── helpers ──────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isWithinNextWeek = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return d >= now && d <= weekEnd;
};

const copyToClipboard = (text) => {
  navigator.clipboard?.writeText(text)
    .then(() => toast.success("Link copied to clipboard"))
    .catch(() => toast.error("Could not copy link"));
};

// ── Action dropdown on the ⋮ button ──────────────────────────────────────────
const ActionMenu = ({ cls, user, onEnd, onDelete, onCopy }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-7 z-30 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-panel">
          <button
            onClick={() => { onCopy(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Copy Join Link
          </button>

          {cls.status === "live" ? (
            <button
              onClick={() => { onEnd(cls._id); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              End Class
            </button>
          ) : null}

          <button
            onClick={() => { onDelete(cls._id); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" /></svg>
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminLiveClassesPage = () => {
  const { user } = useAuth();
  const { data: classes, loading, refresh } = useFetch(() => api.get("/live-classes"), []);
  const { data: courses } = useFetch(() => api.get("/courses"), []);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const sortedCourses = useMemo(
    () => courses.filter((c) => c.status === "published" || c.status === "draft"),
    [courses]
  );

  const liveClasses = useMemo(() => Array.isArray(classes) ? classes : [], [classes]);

  const live = useMemo(() => liveClasses.filter((c) => c.status === "live"), [liveClasses]);
  const upcoming = useMemo(() => liveClasses.filter((c) => c.status === "scheduled"), [liveClasses]);
  const past = useMemo(() => liveClasses.filter((c) => c.status === "ended"), [liveClasses]);

  // ── Tab filtering ──────────────────────────────────────────────────────────
  const tabClasses = useMemo(() => {
    if (activeTab === 0) {
      // All Scheduled: live + all upcoming
      return [...live, ...upcoming];
    }
    if (activeTab === 1) {
      // Today's List: live now + scheduled for today
      return [
        ...live,
        ...upcoming.filter((c) => isToday(c.scheduledAt))
      ];
    }
    // Upcoming Week: scheduled in next 7 days
    return upcoming.filter((c) => isWithinNextWeek(c.scheduledAt));
  }, [activeTab, live, upcoming]);

  // ── Secure join: get one-time token then open livesession ─────────────────
  const openSession = async (cls) => {
    try {
      const url = await buildLiveClassJoinUrl(cls);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open session. Please try again.");
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const createClass = async (payload) => {
    setSaving(true);
    try {
      const { data } = await api.post("/live-classes", payload);
      toast.success("Live class created");
      setOpen(false);
      refresh();
      if (payload.isImmediate) openSession(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create class");
    } finally { setSaving(false); }
  };

  const endClass = async (id) => {
    try { await api.put(`/live-classes/${id}/end`); toast.success("Class ended"); refresh(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const deleteClass = async (id) => {
    if (!window.confirm("Delete this live class?")) return;
    try { await api.delete(`/live-classes/${id}`); toast.success("Class deleted"); refresh(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const historyRows = showAllHistory ? past : past.slice(0, 8);

  if (loading) return <Loader label="Loading live classes..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Live Class Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and schedule ongoing academic sessions.</p>
        </div>
      </div>

      {/* Schedule new session CTA */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-brand-ink">Schedule New Session</p>
            <p className="text-xs text-slate-500">Plan a new live lecture for any course.</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cta py-3.5 text-sm font-bold text-white hover:brightness-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
          Create Schedule
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TAB_FILTERS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${activeTab === i ? "bg-white text-brand-ink shadow-sm" : "text-slate-500 hover:text-brand-ink"}`}>
            {t}
            {i === 1 && live.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{live.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Class cards */}
      {tabClasses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
          {activeTab === 1 ? "No live or scheduled classes for today." : activeTab === 2 ? "No classes scheduled in the next 7 days." : "No scheduled classes yet."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tabClasses.map((cls) => {
            const badge = STATUS_BADGE[cls.status] || STATUS_BADGE.ended;
            return (
              <div key={cls._id} className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition-all hover:shadow-cardHover">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${badge.cls}`}>{badge.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">
                      {cls.subject || cls.course?.title?.slice(0, 18) || "GENERAL"}
                    </span>
                  </div>
                  <ActionMenu
                    cls={cls}
                    user={user}
                    onEnd={endClass}
                    onDelete={deleteClass}
                    onCopy={async () => {
                      try {
                        const url = await buildLiveClassJoinUrl(cls);
                        copyToClipboard(url);
                      } catch { toast.error("Could not generate join link"); }
                    }}
                  />
                </div>

                <h3 className="mt-2 text-base font-bold text-brand-ink">{cls.title}</h3>

                <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0116 0v1" /></svg>
                    {cls.instructor?.name || "Unassigned"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    {cls.isImmediate
                      ? "Started Immediately"
                      : cls.scheduledAt
                        ? new Date(cls.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                        : "TBD"}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-[11px] text-slate-400">
                    Room: <span className="font-mono font-medium text-slate-600">{cls.roomName || "—"}</span>
                  </div>

                  {cls.status === "live" ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openSession(cls)}
                        className="rounded-md bg-brand-primary px-3 py-1 text-[11px] font-bold text-white hover:brightness-110">
                        Join Session →
                      </button>
                      <button onClick={() => endClass(cls._id)}
                        className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">
                        End
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openSession(cls)}
                      className="rounded-md bg-brand-surface px-3 py-1 text-[11px] font-semibold text-brand-primary hover:bg-brand-surface/70">
                      Manage Link ↗
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past sessions table */}
      {past.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-brand-ink">Past Sessions Archive</h3>
              <p className="text-xs text-slate-400">{past.length} session{past.length !== 1 ? "s" : ""} total</p>
            </div>
            {past.length > 8 ? (
              <button
                onClick={() => setShowAllHistory((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                {showAllHistory ? "Show Less" : `View All ${past.length}`}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`h-3.5 w-3.5 transition-transform ${showAllHistory ? "rotate-90" : ""}`}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-left">Class Title</th>
                  <th className="px-5 py-3 text-left">Instructor</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Room</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyRows.map((cls) => (
                  <tr key={cls._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-brand-ink">{cls.title}</td>
                    <td className="px-5 py-3 text-slate-500">{cls.instructor?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(cls.scheduledAt || cls.createdAt)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{cls.roomName || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => deleteClass(cls._id)}
                          title="Delete"
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAllHistory && past.length > 8 ? (
            <div className="border-t border-slate-100 px-5 py-3 text-center">
              <button onClick={() => setShowAllHistory(true)} className="text-xs font-semibold text-brand-primary hover:underline">
                Show {past.length - 8} more sessions
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <LiveClassModal
        open={open}
        onClose={() => setOpen(false)}
        courses={sortedCourses}
        onSubmit={createClass}
        loading={saving}
      />
    </div>
  );
};

export default AdminLiveClassesPage;
