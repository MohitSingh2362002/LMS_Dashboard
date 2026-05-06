import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

/* ── Type config ────────────────────────────────────────────────────────── */
const TYPE = {
  urgent:  { bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-700",   dot: "bg-rose-500",   badge: "URGENT"  },
  general: { bg: "bg-brand-surface", border: "border-brand-primary/20", text: "text-brand-primary", dot: "bg-brand-primary", badge: "GENERAL" },
  info:    { bg: "bg-slate-50",   border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-400",  badge: "INFO"    },
};

/* ── Create Form ────────────────────────────────────────────────────────── */
const CreateForm = ({ onCreated }) => {
  const [type,    setType]    = useState("general");
  const [title,   setTitle]   = useState("");
  const [message, setMessage] = useState("");
  const [pinned,  setPinned]  = useState(false);
  const [saving,  setSaving]  = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error("Message is required"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/announcements", { type, title: title.trim(), message: message.trim(), pinned });
      toast.success("Announcement posted!");
      onCreated(data);
      setTitle(""); setMessage(""); setType("general"); setPinned(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
      <h2 className="mb-5 text-base font-extrabold text-brand-ink">New Announcement</h2>

      {/* Type chips */}
      <div className="mb-4 flex gap-2">
        {["urgent", "general", "info"].map((t) => {
          const s = TYPE[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl border py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                type === t
                  ? `${s.bg} ${s.border} ${s.text}`
                  : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          placeholder="Write your announcement message…"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition"
        />
      </div>

      {/* Pin toggle */}
      <label className="mt-3 flex cursor-pointer items-center gap-2.5">
        <div
          onClick={() => setPinned((p) => !p)}
          className={`relative h-5 w-9 rounded-full transition-colors ${pinned ? "bg-brand-primary" : "bg-slate-200"}`}
        >
          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${pinned ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-xs font-semibold text-slate-600">Pin to top</span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !message.trim()}
        className="mt-5 w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-50 transition"
      >
        {saving ? "Posting…" : "Post Announcement"}
      </button>
    </form>
  );
};

/* ── Announcement Card ──────────────────────────────────────────────────── */
const AnnouncementCard = ({ ann, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const s = TYPE[ann.type] || TYPE.general;

  const handleDelete = async () => {
    if (!window.confirm("Delete this announcement?")) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${ann._id}`);
      toast.success("Deleted");
      onDelete(ann._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <article className={`relative overflow-hidden rounded-2xl border p-5 transition hover:shadow-card ${s.bg} ${s.border}`}>
      {/* Pin badge */}
      {ann.pinned && (
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-brand-primary shadow-sm">
          📌 Pinned
        </span>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${s.text}`}>{s.badge}</span>
      </div>

      {/* Title + message */}
      {ann.title && (
        <h3 className="text-sm font-extrabold text-brand-ink mb-1">{ann.title}</h3>
      )}
      <p className="text-sm text-slate-700 leading-relaxed">{ann.message}</p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Author avatar */}
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white">
            {(ann.author?.name || "A").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-600">{ann.author?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-400">{formatDate(ann.createdAt)}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
        >
          {deleting ? "…" : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Delete
            </>
          )}
        </button>
      </div>
    </article>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────────── */
const AdminAnnouncementsPage = () => {
  const { data, loading, setData } = useFetch(() => api.get("/announcements"), []);
  const announcements = Array.isArray(data) ? data : [];

  const handleCreated = (ann) => setData((prev) => [ann, ...(Array.isArray(prev) ? prev : [])]);
  const handleDeleted = (id)  => setData((prev) => (Array.isArray(prev) ? prev : []).filter((a) => a._id !== id));

  const pinned   = announcements.filter((a) => a.pinned);
  const unpinned = announcements.filter((a) => !a.pinned);

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Post announcements visible to all instructors and learners. {announcements.length} total.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-surface px-4 py-2">
          <span className="text-lg">📢</span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500">Active</p>
            <p className="text-sm font-extrabold text-brand-primary">{announcements.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* ── Create form (left / top) ── */}
        <div>
          <CreateForm onCreated={handleCreated} />

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Urgent",  val: announcements.filter((a) => a.type === "urgent").length,  color: "text-rose-600",        bg: "bg-rose-50",   border: "border-rose-200"   },
              { label: "General", val: announcements.filter((a) => a.type === "general").length, color: "text-brand-primary",   bg: "bg-brand-surface", border: "border-brand-primary/20" },
              { label: "Info",    val: announcements.filter((a) => a.type === "info").length,    color: "text-slate-600",       bg: "bg-slate-50",  border: "border-slate-200"  },
            ].map(({ label, val, color, bg, border }) => (
              <div key={label} className={`rounded-xl border p-3 text-center ${bg} ${border}`}>
                <p className={`text-xl font-extrabold ${color}`}>{val}</p>
                <p className="text-[10px] font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── List (right / bottom) ── */}
        <div className="space-y-4">
          {loading ? (
            <Loader label="Loading announcements…" />
          ) : !announcements.length ? (
            <EmptyState
              title="No announcements yet"
              description="Post your first announcement using the form."
            />
          ) : (
            <>
              {/* Pinned first */}
              {pinned.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">📌 Pinned</p>
                  {pinned.map((a) => (
                    <AnnouncementCard key={a._id} ann={a} onDelete={handleDeleted} />
                  ))}
                </div>
              )}

              {/* Rest */}
              {unpinned.length > 0 && (
                <div className="space-y-3">
                  {pinned.length > 0 && (
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All Announcements</p>
                  )}
                  {unpinned.map((a) => (
                    <AnnouncementCard key={a._id} ann={a} onDelete={handleDeleted} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncementsPage;
