import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { formatDate } from "../../utils/helpers";

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  blocked: "bg-rose-100 text-rose-700"
};

const RELATION_COLORS = ["bg-brand-primary", "bg-brand-accent", "bg-brand-cta", "bg-emerald-500", "bg-violet-500"];

// ── Shared avatar initials ──────────────────────────────────────────
const Avatar = ({ name, size = "h-9 w-9", color = "bg-brand-surface text-brand-primary" }) => (
  <div className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${size} ${color}`}>
    {(name || "?").slice(0, 2).toUpperCase()}
  </div>
);

// ── Student Directory View ──────────────────────────────────────────
const StudentDirectory = ({ users, learnerBatchMap = {}, onDeactivate, onRegister }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    return users.filter((u) =>
      !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = { total: users.length };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Student Directory</h1>
          <p className="mt-1 text-sm text-slate-500">Manage enrollments, batches, and academic progress for all registered learners.</p>
        </div>
        <button onClick={onRegister}
          className="flex items-center gap-2 rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 110 8A4 4 0 0112.5 7zM20 8v6M23 11h-6" /></svg>
          Register Student
        </button>
      </div>

      {/* Stat tile */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-card w-fit">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Students</p>
          <p className="mt-0.5 text-2xl font-bold text-brand-ink">{counts.total.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Student Name</th>
                <th className="px-5 py-3 text-left">Student ID</th>
                <th className="px-5 py-3 text-left">Batch Info</th>
                <th className="px-5 py-3 text-left">Enrollment Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((u, i) => (
                <tr key={u._id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} color={`${RELATION_COLORS[i % RELATION_COLORS.length]} text-white`} />
                      <div>
                        <p className="font-semibold text-brand-ink">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                    {u.studentId || `STU${parseInt(u._id?.slice(-6) || "0", 16) % 100000 .toString().padStart(5, "0")}`}
                  </td>
                  <td className="px-5 py-3.5">
                    {(() => {
                      const batchNames = learnerBatchMap[String(u._id)] || [];
                      return batchNames.length ? (
                        <div className="flex flex-wrap gap-1">
                          {batchNames.slice(0, 2).map((n) => (
                            <span key={n} className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand-primary">{n}</span>
                          ))}
                          {batchNames.length > 2 ? <span className="text-[10px] text-slate-400">+{batchNames.length - 2}</span> : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No batch</span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE.active}`}>Enrolled</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onDeactivate(u._id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No students found</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length.toLocaleString()} students
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 disabled:opacity-40">‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`rounded px-2 py-0.5 ${page === i + 1 ? "bg-brand-accent text-white" : "border border-slate-200 hover:bg-slate-50"}`}>
                {i + 1}
              </button>
            ))}
            {totalPages > 5 ? <span>…</span> : null}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 disabled:opacity-40">›</button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={onRegister}
        className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg hover:brightness-110">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  );
};

// ── Guardian/Parent View ────────────────────────────────────────────
const ParentDirectory = ({ users, learners, onInvite, onDeactivate }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(
    () => users.filter((u) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Academic Management</p>
          <h1 className="text-2xl font-bold text-brand-ink">Parent &amp; Guardian Management</h1>
          <p className="mt-1 text-sm text-slate-500">Review family associations and platform access for all registered guardians.</p>
        </div>
        <button onClick={onInvite}
          className="flex items-center gap-2 rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 110 8A4 4 0 0112.5 7zM20 8v6M23 11h-6" /></svg>
          Invite New Parent
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Total Guardians", value: users.length.toLocaleString(),
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
          },
          {
            label: "With Linked Students", value: users.filter((u) => u.linkedLearners?.length > 0).length,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
          },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">{s.icon}</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className="mt-0.5 text-2xl font-bold text-brand-ink">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + pagination info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm"
          />
        </div>
        <p className="text-xs text-slate-500">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length.toLocaleString()} parents
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3 text-left">Guardian Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Linked Student(s)</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((u, i) => {
                const linked = Array.isArray(u.linkedLearners) ? u.linkedLearners : [];
                return (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={`${RELATION_COLORS[i % RELATION_COLORS.length]} text-white`} />
                        <div>
                          <p className="font-semibold text-brand-ink">{u.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {u._id?.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email only — no fake phone */}
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 flex-shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
                        {u.email}
                      </p>
                    </td>

                    {/* Linked learners — full names */}
                    <td className="px-5 py-3.5">
                      {linked.length ? (
                        <div className="space-y-1">
                          {linked.map((l, li) => (
                            <div key={l._id || li} className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${RELATION_COLORS[li % RELATION_COLORS.length]}`} />
                              <span className="text-xs font-medium text-brand-ink">{l.name || "Unknown"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No students linked</span>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(u.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => onDeactivate(u._id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Remove parent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!paginated.length ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">No guardians found</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="disabled:opacity-40 hover:text-brand-ink">‹ Previous</button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`rounded px-2 py-0.5 ${page === i + 1 ? "bg-brand-accent text-white" : "border border-slate-200 hover:bg-slate-50"}`}>
                {i + 1}
              </button>
            ))}
            {totalPages > 5 ? <span>…</span> : null}
          </div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="disabled:opacity-40 hover:text-brand-ink">Next ›</button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────
const AdminUsersPage = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "";

  const [form, setForm] = useState({ name: "", email: "", password: "", role: roleParam === "parent" ? "parent" : "learner", linkedLearners: [] });
  const [showForm, setShowForm] = useState(false);

  // Default to learner when no role param (student directory view)
  const fetchRole = roleParam || "learner";
  const { data: users, loading, refresh } = useFetch(
    () => api.get(`/users?role=${fetchRole}`),
    [fetchRole]
  );
  const { data: learnerOptions } = useFetch(() => api.get("/users?role=learner"), []);
  const { data: allBatches } = useFetch(() => api.get("/batches"), []);

  const learners = useMemo(() => (Array.isArray(learnerOptions) ? learnerOptions : []), [learnerOptions]);

  // Build learner → batch lookup map
  const learnerBatchMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(allBatches)) return map;
    allBatches.forEach((b) => {
      (b.learners || []).forEach((lid) => {
        const id = lid?._id || lid;
        if (!map[String(id)]) map[String(id)] = [];
        map[String(id)].push(b.name);
      });
    });
    return map;
  }, [allBatches]);

  const toggleLinkedLearner = (id) => {
    const exists = form.linkedLearners.includes(id);
    setForm({ ...form, linkedLearners: exists ? form.linkedLearners.filter((x) => x !== id) : [...form.linkedLearners, id] });
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      toast.success("User created");
      setForm({ name: "", email: "", password: "", role: roleParam === "parent" ? "parent" : "learner", linkedLearners: [] });
      setShowForm(false);
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Create failed"); }
  };

  const deactivateUser = async (id) => {
    if (!window.confirm("Deactivate this user?")) return;
    try { await api.delete(`/users/${id}`); toast.success("User deactivated"); refresh(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <Loader label="Loading users..." />;

  const arr = Array.isArray(users) ? users : [];

  return (
    <>
      {/* Quick-create modal */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <form onSubmit={createUser} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-bold text-brand-ink">{roleParam === "parent" ? "Invite New Parent" : "Register Student"}</h3>
            <div className="mt-4 space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" required />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" required />
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              {/* Role selector — only show relevant options based on context */}
              {roleParam === "parent" ? (
                <input value="Parent" readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-default" />
              ) : (
                <input value="Learner" readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-default" />
              )}
              {form.role === "parent" ? (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                  <p className="px-3 pt-2 text-[10px] font-semibold uppercase text-slate-400">Link learners</p>
                  {learners.map((l) => (
                    <label key={l._id} className="flex items-center gap-2 border-b border-slate-50 px-3 py-2 text-xs last:border-0 hover:bg-slate-50">
                      <input type="checkbox" checked={form.linkedLearners.includes(l._id)} onChange={() => toggleLinkedLearner(l._id)} />
                      <span>{l.name}</span>
                    </label>
                  ))}
                  {!learners.length ? <p className="px-3 py-2 text-xs text-slate-500">No learners yet</p> : null}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-brand-cta py-2.5 text-sm font-bold text-white hover:brightness-95">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      {roleParam === "parent" ? (
        <ParentDirectory users={arr} learners={learners} onInvite={() => setShowForm(true)} onDeactivate={deactivateUser} />
      ) : (
        <StudentDirectory users={arr} learnerBatchMap={learnerBatchMap} onDeactivate={deactivateUser} onRegister={() => setShowForm(true)} />
      )}
    </>
  );
};

export default AdminUsersPage;
