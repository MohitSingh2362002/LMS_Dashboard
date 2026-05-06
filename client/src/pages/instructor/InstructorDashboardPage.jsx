import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";

/* ── Course code badge ────────────────────────────────────────────── */
const courseCode = (course) => {
  const words = (course?.title || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return course?._id?.slice(-4).toUpperCase() || "---";
};

const CODE_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
];

const STATUS_PILL = {
  "On Track": "bg-emerald-100 text-emerald-700",
  Pending:    "bg-amber-100 text-amber-700",
  "At Risk":  "bg-rose-100 text-rose-700",
};

const TYPE_COLOR = {
  urgent:  { dot: "bg-brand-cta",    label: "text-brand-cta",    badge: "URGENT"  },
  general: { dot: "bg-brand-accent", label: "text-brand-accent", badge: "GENERAL" },
  info:    { dot: "bg-slate-400",    label: "text-slate-400",    badge: "INFO"    },
};

/* ── Add Announcement Modal ───────────────────────────────────────── */
const AddAnnouncementModal = ({ onClose, onSave }) => {
  const [type, setType]       = useState("general");
  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error("Message is required"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/announcements", { type, title, message });
      onSave(data);
      toast.success("Announcement posted");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-brand-ink">New Announcement</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Type selector */}
        <div className="mb-4 flex gap-2">
          {["urgent", "general", "info"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg border py-2 text-xs font-bold uppercase tracking-wide transition ${
                type === t
                  ? t === "urgent"  ? "border-rose-400 bg-rose-50 text-rose-600"
                  : t === "general" ? "border-brand-accent bg-brand-surface text-brand-primary"
                  : "border-slate-300 bg-slate-100 text-slate-600"
                  : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={3}
            placeholder="Write your announcement…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-brand-ink py-2.5 text-sm font-bold text-white hover:brightness-90 disabled:opacity-60">
            {saving ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────────── */
const InstructorDashboardPage = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: courses,       loading: lc } = useFetch(() => api.get("/courses"), []);
  const { data: batches,       loading: lb } = useFetch(() => api.get("/batches"), []);
  const { data: announcements, loading: la, setData: setAnnouncements } =
    useFetch(() => api.get("/announcements"), []);
  const { data: attendance }                 = useFetch(() => api.get("/attendance"), []);

  const coursesArr = Array.isArray(courses)       ? courses       : [];
  const batchArr   = Array.isArray(batches)       ? batches       : [];
  const annoArr    = Array.isArray(announcements) ? announcements : [];
  const attArr     = Array.isArray(attendance)    ? attendance    : [];

  const totalEnrollments = useMemo(
    () => coursesArr.reduce((s, c) => s + (c.enrollmentCount || 0), 0),
    [coursesArr]
  );

  /* Attendance rate per learner */
  const attendanceMap = useMemo(() => {
    const map = {};
    attArr.forEach((session) => {
      (session.records || []).forEach((rec) => {
        const lid = String(rec.learner?._id || rec.learner);
        if (!map[lid]) map[lid] = { present: 0, total: 0 };
        map[lid].total++;
        if (rec.status === "present") map[lid].present++;
      });
    });
    return map;
  }, [attArr]);

  /* Flatten batch learners → progress rows */
  const progressRows = useMemo(() => {
    const rows = [];
    batchArr.forEach((batch) => {
      (batch.learners || []).forEach((learner) => {
        const lid  = String(learner._id);
        const att  = attendanceMap[lid];
        const rate = att?.total ? Math.round((att.present / att.total) * 100) : null;
        rows.push({
          id:       lid,
          name:     learner.name || "Unknown",
          initials: (learner.name || "?").slice(0, 2).toUpperCase(),
          course:   batch.course?.title || "—",
          status:   rate === null ? "Pending" : rate >= 75 ? "On Track" : rate >= 40 ? "Pending" : "At Risk",
          progress: rate ?? 0,
        });
      });
    });
    return rows.slice(0, 8);
  }, [batchArr, attendanceMap]);

  const deleteAnnouncement = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success("Announcement removed");
    } catch {
      toast.error("Could not delete");
    }
  };

  if (lc || lb) return <Loader label="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      {showAddModal && (
        <AddAnnouncementModal
          onClose={() => setShowAddModal(false)}
          onSave={(a) => setAnnouncements((prev) => [a, ...prev])}
        />
      )}

      {/* ── Welcome Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-ink p-7 text-white">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-2xl font-bold">Welcome back, {user.name} 👋</h1>
          <p className="mt-2 text-sm text-white/70">
            Manage your curriculum, track student engagement, and optimise your teaching workflow from your central master dashboard.
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex gap-3 z-10">
          {coursesArr.slice(0, 3).map((c) => (
            <div key={c._id} className="w-28 rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[9px] uppercase tracking-wider text-white/50 font-bold">{c.status}</p>
              <p className="mt-1 text-xs font-bold text-white truncate">{c.title}</p>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/90 to-transparent pointer-events-none" />
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            label: "ASSIGNED COURSES", value: coursesArr.length,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>,
          },
          {
            label: "ENROLLMENTS", value: totalEnrollments,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path d="M22 10v6M2 10l10-5 10 5-10 5L2 10z" /><path d="M6 12v5a6 3 0 0012 0v-5" /></svg>,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center shadow-card">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">
              {s.icon}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-1 text-4xl font-bold text-brand-ink">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── My Courses ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-brand-ink">My Courses</h2>
            <p className="text-xs text-slate-500">Active curriculum under your management.</p>
          </div>
          <button onClick={() => navigate("/instructor/resources")} className="flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">
            View All →
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {coursesArr.slice(0, 6).map((c, idx) => (
            <div key={c._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${CODE_COLORS[idx % CODE_COLORS.length]}`}>
                {courseCode(c)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-ink truncate">{c.title}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                  <span>{c.enrollmentCount || 0} learners</span>
                  <span>{c.pages?.length || 0} {c.pages?.length === 1 ? "page" : "pages"}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {c.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/instructor/resources")}
                className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold text-white hover:bg-brand-ink transition"
              >
                Preview
              </button>
            </div>
          ))}
          {!coursesArr.length && (
            <div className="px-6 py-10 text-center text-sm text-slate-500">No courses assigned yet.</div>
          )}
        </div>
      </div>

      {/* ── Student Progress + Announcements ── */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr,1fr]">
        {/* Progress table */}
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-bold text-blue-700">Student Progress Overview</h2>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Last 7 Days</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3 text-left">Student</th>
                  <th className="px-6 py-3 text-left">Course</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progressRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary">
                          {row.initials}
                        </div>
                        <span className="font-semibold text-brand-ink">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 max-w-[120px] truncate text-slate-500">{row.course}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_PILL[row.status]}`}>
                        {row.status === "On Track" ? "ON TRACK" : row.status === "At Risk" ? "AT RISK" : "PENDING"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${row.progress >= 75 ? "bg-emerald-500" : row.progress >= 40 ? "bg-brand-primary" : "bg-rose-500"}`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{row.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!progressRows.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                      No student data yet. Mark attendance to see progress here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Announcements panel ── */}
        <div className="flex flex-col rounded-2xl bg-brand-ink text-white shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <h2 className="text-base font-bold">Announcements</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cta text-lg font-bold text-white hover:brightness-110 transition"
              title="New announcement"
            >
              +
            </button>
          </div>

          {la ? (
            <div className="flex flex-1 items-center justify-center py-10">
              <p className="text-sm text-white/40">Loading…</p>
            </div>
          ) : !annoArr.length ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-white/30">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-white/50">No announcements yet.</p>
              <button onClick={() => setShowAddModal(true)} className="text-xs font-semibold text-brand-cta hover:underline">
                Post the first one
              </button>
            </div>
          ) : (
            <div className="flex-1 divide-y divide-white/10 overflow-y-auto">
              {annoArr.slice(0, 5).map((a) => {
                const tc = TYPE_COLOR[a.type] || TYPE_COLOR.general;
                return (
                  <div key={a._id} className="group px-6 py-4 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${tc.label}`}>{tc.badge}</p>
                        {a.title && <p className="mt-0.5 text-sm font-semibold text-white truncate">{a.title}</p>}
                        <p className="mt-1 text-sm text-white/75 leading-snug">{a.message}</p>
                        <p className="mt-1.5 text-[10px] text-white/35">{formatDate(a.createdAt)}</p>
                      </div>
                      <button
                        onClick={() => deleteAnnouncement(a._id)}
                        className="shrink-0 rounded p-1 text-white/20 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition"
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-white/10 px-6 py-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full rounded-xl border border-white/25 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              New Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
