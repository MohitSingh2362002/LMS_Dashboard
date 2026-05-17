import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

const NOTIF_SERVICE = import.meta.env.VITE_NOTIF_SERVICE_URL || "http://localhost:7002";
const NOTIF_KEY     = import.meta.env.VITE_NOTIF_SERVICE_KEY || "";

const notifApi = async (method, path, body) => {
  const res = await fetch(`${NOTIF_SERVICE}${path}`, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${NOTIF_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const STATUS_COLORS = {
  queued:    "bg-amber-100 text-amber-700",
  sending:   "bg-blue-100 text-blue-700",
  sent:      "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
  draft:     "bg-slate-100 text-slate-500",
};

const CHANNEL_ICONS = { push: "🔔", "in-app": "💬" };

function StatPill({ label, value, color }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${color}`}>
      <p className="text-2xl font-black">{value ?? "—"}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

// ── Composer ──────────────────────────────────────────────────────────────
function Composer({ onSent, courses, batches, users }) {
  const [form, setForm] = useState({
    title:      "",
    body:       "",
    imageUrl:   "",
    targetType: "all",
    targetIds:  [],
    channels:   ["push", "in-app"],
    scheduledAt:"",
    data:       "{}",
  });
  const [sending, setSending] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleChannel = (ch) => {
    setForm(p => ({
      ...p,
      channels: p.channels.includes(ch)
        ? p.channels.filter(c => c !== ch)
        : [...p.channels, ch],
    }));
  };

  const toggleTargetId = (id) => {
    setForm(p => ({
      ...p,
      targetIds: p.targetIds.includes(id)
        ? p.targetIds.filter(x => x !== id)
        : [...p.targetIds, id],
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and body are required");
    if (!form.channels.length) return toast.error("Select at least one channel");
    if (["course","batch","users"].includes(form.targetType) && !form.targetIds.length) {
      return toast.error("Select at least one target");
    }

    let parsedData = {};
    try { parsedData = JSON.parse(form.data || "{}"); } catch { return toast.error("Data JSON is invalid"); }

    setSending(true);
    try {
      const endpoint = form.scheduledAt ? "/notifications/schedule" : "/notifications";
      await notifApi("POST", endpoint, {
        title:      form.title,
        body:       form.body,
        imageUrl:   form.imageUrl,
        targetType: form.targetType,
        targetIds:  form.targetIds,
        channels:   form.channels,
        scheduledAt:form.scheduledAt || null,
        data:       parsedData,
      });
      toast.success(form.scheduledAt ? "Notification scheduled!" : "Notification sent!");
      setForm({ title:"", body:"", imageUrl:"", targetType:"all", targetIds:[], channels:["push","in-app"], scheduledAt:"", data:"{}" });
      onSent();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const targetOptions = {
    course: courses,
    batch:  batches,
    users:  users,
  }[form.targetType] ?? [];

  return (
    <form onSubmit={handleSend} className="space-y-5 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
      <h2 className="text-base font-bold text-brand-ink">🔔 Compose Notification</h2>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-ink">Title <span className="text-red-500">*</span></label>
        <input value={form.title} onChange={e => set("title", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder="e.g. New course available!" maxLength={100} />
        <p className="mt-0.5 text-right text-xs text-slate-400">{form.title.length}/100</p>
      </div>

      {/* Body */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-ink">Message <span className="text-red-500">*</span></label>
        <textarea value={form.body} onChange={e => set("body", e.target.value)} rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder="Write your message…" maxLength={500} />
        <p className="mt-0.5 text-right text-xs text-slate-400">{form.body.length}/500</p>
      </div>

      {/* Image URL */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-ink">Image URL <span className="text-slate-400 font-normal">(optional)</span></label>
        <input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} type="url"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder="https://…" />
      </div>

      {/* Channels */}
      <div>
        <label className="mb-2 block text-sm font-medium text-brand-ink">Delivery Channels</label>
        <div className="flex gap-3">
          {["push", "in-app"].map(ch => (
            <button key={ch} type="button" onClick={() => toggleChannel(ch)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                form.channels.includes(ch)
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>
              <span>{CHANNEL_ICONS[ch]}</span>
              {ch === "push" ? "Push Notification" : "In-App (Real-time)"}
            </button>
          ))}
        </div>
      </div>

      {/* Target */}
      <div>
        <label className="mb-2 block text-sm font-medium text-brand-ink">Target Audience</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { value: "all",   label: "🌍 All Learners" },
            { value: "course",label: "📚 By Course" },
            { value: "batch", label: "👥 By Batch" },
            { value: "users", label: "👤 Specific Users" },
          ].map(({ value, label }) => (
            <button key={value} type="button" onClick={() => set("targetType", value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                form.targetType === value
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Multi-select for course/batch/users */}
        {form.targetType !== "all" && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
            {targetOptions.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No {form.targetType}s found</p>
            ) : (
              targetOptions.map(item => {
                const id = String(item._id);
                const selected = form.targetIds.includes(id);
                return (
                  <button key={id} type="button" onClick={() => toggleTargetId(id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      selected ? "bg-brand-primary/10 font-semibold text-brand-primary" : "hover:bg-slate-100 text-brand-ink"
                    }`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      selected ? "border-brand-primary bg-brand-primary text-white" : "border-slate-300"
                    }`}>{selected ? "✓" : ""}</span>
                    {item.title || item.name}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-ink">Schedule <span className="text-slate-400 font-normal">(leave blank to send now)</span></label>
        <input type="datetime-local" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
      </div>

      {/* Preview */}
      {(form.title || form.body) && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-800 to-slate-900 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Push Preview</p>
          <div className="flex items-start gap-3 rounded-xl bg-white/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white text-lg">🎓</div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">{form.title || "Title"}</p>
              <p className="mt-0.5 text-xs text-slate-300 line-clamp-2">{form.body || "Message body…"}</p>
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={sending}
        className="w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
        {sending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {form.scheduledAt ? "Scheduling…" : "Sending…"}
          </span>
        ) : (
          form.scheduledAt ? "📅 Schedule Notification" : "🚀 Send Now"
        )}
      </button>
    </form>
  );
}

// ── Notification row ──────────────────────────────────────────────────────
function NotifRow({ n, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const total   = n.stats?.total   || 0;
  const sent    = n.stats?.sent    || 0;
  const read    = n.stats?.read    || 0;
  const failed  = n.stats?.failed  || 0;

  return (
    <>
      <tr className="cursor-pointer transition-colors hover:bg-slate-50/60" onClick={() => setExpanded(v => !v)}>
        <td className="px-5 py-4">
          <p className="font-semibold text-brand-ink">{n.title}</p>
          <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{n.body}</p>
        </td>
        <td className="px-5 py-4">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_COLORS[n.status] ?? "bg-slate-100 text-slate-500"}`}>
            {n.status}
          </span>
        </td>
        <td className="px-5 py-4 text-sm text-slate-500 capitalize">{n.targetType}</td>
        <td className="px-5 py-4">
          <div className="flex gap-1">
            {(n.channels || []).map(ch => (
              <span key={ch} className="text-base" title={ch}>{CHANNEL_ICONS[ch]}</span>
            ))}
          </div>
        </td>
        <td className="px-5 py-4 text-sm text-slate-500">
          {n.scheduledAt
            ? new Date(n.scheduledAt).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
            : new Date(n.createdAt).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-brand-ink">{total} <span className="font-normal text-slate-400">total</span></span>
            <span className="text-green-600">{sent} sent</span>
            <span className="text-blue-600">{read} read</span>
            {failed > 0 && <span className="text-red-500">{failed} fail</span>}
          </div>
        </td>
        <td className="px-5 py-4 text-right">
          {["queued","draft"].includes(n.status) && (
            <button onClick={e => { e.stopPropagation(); onCancel(n); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition">
              Cancel
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={7} className="px-5 pb-4 pt-2">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Recipients", value: total,  color: "border-slate-200 bg-white text-slate-700" },
                { label: "Sent",             value: sent,   color: "border-green-200 bg-green-50 text-green-800" },
                { label: "Read",             value: read,   color: "border-blue-200 bg-blue-50 text-blue-800" },
                { label: "Failed",           value: failed, color: "border-red-200 bg-red-50 text-red-700" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            {n.stats?.total > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Delivery rate</span>
                  <span>{total > 0 ? Math.round((sent / total) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${total > 0 ? (sent / total) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminPushNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [courses,       setCourses]       = useState([]);
  const [batches,       setBatches]       = useState([]);
  const [users,         setUsers]         = useState([]);
  const [page,          setPage]          = useState(1);
  const [pages,         setPages]         = useState(1);

  const load = async (p = 1) => {
    try {
      const data = await notifApi("GET", `/notifications?page=${p}&limit=15`);
      setNotifications(data.items ?? []);
      setPage(data.page ?? 1);
      setPages(data.pages ?? 1);
    } catch (err) {
      toast.error("Could not load notifications: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTargetData = async () => {
    try {
      const [cRes, bRes, uRes] = await Promise.allSettled([
        api.get("/courses"),
        api.get("/batches"),
        api.get("/users?role=learner&limit=200"),
      ]);
      if (cRes.status === "fulfilled") {
        const d = cRes.value.data; setCourses(Array.isArray(d) ? d : d.courses ?? []);
      }
      if (bRes.status === "fulfilled") {
        const d = bRes.value.data; setBatches(Array.isArray(d) ? d : d.batches ?? []);
      }
      if (uRes.status === "fulfilled") {
        const d = uRes.value.data; setUsers(Array.isArray(d) ? d : d.users ?? []);
      }
    } catch { /* non-fatal */ }
  };

  useEffect(() => { load(); loadTargetData(); }, []);

  const handleCancel = async (notif) => {
    try {
      await notifApi("DELETE", `/notifications/${notif._id}`);
      toast.success("Notification cancelled");
      load(page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Summary stats
  const totalSent = notifications.reduce((s, n) => s + (n.stats?.sent || 0), 0);
  const totalRead = notifications.reduce((s, n) => s + (n.stats?.read || 0), 0);
  const sent      = notifications.filter(n => n.status === "sent").length;
  const scheduled = notifications.filter(n => n.status === "queued" && n.scheduledAt).length;

  return (
    <div className="animate-fadeIn space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Push Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Broadcast to all learners, a course, a batch, or specific users — via push and in-app.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatPill label="Total Sent"      value={sent}      color="border-green-200 bg-green-50 text-green-800" />
        <StatPill label="Scheduled"       value={scheduled} color="border-amber-200 bg-amber-50 text-amber-800" />
        <StatPill label="Deliveries"      value={totalSent} color="border-brand-primary/20 bg-brand-primary/5 text-brand-primary" />
        <StatPill label="Total Reads"     value={totalRead} color="border-blue-200 bg-blue-50 text-blue-800" />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
        {/* Composer */}
        <div className="xl:col-span-2">
          <Composer onSent={() => load(1)} courses={courses} batches={batches} users={users} />
        </div>

        {/* History */}
        <div className="space-y-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-ink">Notification History</h2>
            <button onClick={() => load(page)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
              Refresh
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">🔕</div>
                <p className="font-semibold text-brand-ink">No notifications sent yet</p>
                <p className="text-sm text-slate-500">Compose your first notification on the left.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3.5">Notification</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Target</th>
                        <th className="px-5 py-3.5">Channels</th>
                        <th className="px-5 py-3.5">Time</th>
                        <th className="px-5 py-3.5">Stats</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {notifications.map(n => (
                        <NotifRow key={n._id} n={n} onCancel={handleCancel} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                    <button disabled={page <= 1} onClick={() => load(page - 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                      ← Prev
                    </button>
                    <span className="text-xs text-slate-500">Page {page} of {pages}</span>
                    <button disabled={page >= pages} onClick={() => load(page + 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Setup guide */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <p className="mb-2 font-bold">⚙️ Setup required</p>
            <ol className="list-decimal pl-4 space-y-1 text-xs text-amber-700">
              <li>Install Redis locally or use Redis Cloud</li>
              <li>Create a Firebase project → download <code className="rounded bg-amber-100 px-1 font-mono">firebase-service-account.json</code></li>
              <li>Copy <code className="rounded bg-amber-100 px-1 font-mono">NotificationService/.env.example</code> → <code className="rounded bg-amber-100 px-1 font-mono">.env</code> and fill in values</li>
              <li>Run <code className="rounded bg-amber-100 px-1 font-mono">npm install && npm start</code> in <code className="rounded bg-amber-100 px-1 font-mono">NotificationService/</code></li>
              <li>Add <code className="rounded bg-amber-100 px-1 font-mono">VITE_NOTIF_SERVICE_URL</code> and <code className="rounded bg-amber-100 px-1 font-mono">VITE_NOTIF_SERVICE_KEY</code> to <code className="rounded bg-amber-100 px-1 font-mono">Dash/client/.env</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
