import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { formatDate } from "../../utils/helpers";

const AVATAR_COLORS = [
  "bg-brand-primary", "bg-brand-accent", "bg-emerald-500",
  "bg-violet-500", "bg-rose-500", "bg-amber-500"
];

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  live: "bg-rose-100 text-rose-600",
  inactive: "bg-slate-100 text-slate-500"
};

const DEPT_ACCENT = [
  { bg: "bg-brand-surface", border: "border-brand-accent/20", text: "text-brand-primary", bar: "bg-brand-primary" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500" }
];

const PerfBar = ({ value, max = 5 }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-accent" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-brand-ink">{value.toFixed(1)}</span>
    </div>
  );
};

// Slide-over panel
const DetailPanel = ({ instructor, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: instructor?.name || "",
    email: instructor?.email || "",
    department: instructor?.department || "Science & Tech",
    subject: instructor?.subject || ""
  });

  if (!instructor) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="pointer-events-none flex-1" />
      <aside
        className="pointer-events-auto flex w-80 flex-col border-l border-slate-200 bg-white shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-brand-ink">Instructor Details</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-xl font-bold text-white">
              {instructor.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-base font-bold text-brand-ink">{instructor.name}</p>
            <p className="text-xs text-slate-500">{instructor.email}</p>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[instructor._status || "active"]}`}>
              {instructor._status || "active"}
            </span>
          </div>

          {[
            { label: "Full Name", key: "name" },
            { label: "Email", key: "email" },
            { label: "Department", key: "department" },
            { label: "Primary Subject", key: "subject" }
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-accent focus:bg-white focus:outline-none"
              />
            </div>
          ))}

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Metrics</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs">
              {[
                { label: "Batches", value: instructor._batches ?? "—" },
                { label: "Courses", value: instructor._courses ?? "—" },
                { label: "Joined", value: formatDate(instructor.createdAt) },
                { label: "Rating", value: instructor._rating !== null ? `${instructor._rating.toFixed(1)} / 5` : "No reviews" }
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-white p-2 shadow-sm">
                  <p className="font-bold text-brand-ink">{m.value}</p>
                  <p className="text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
          <button
            onClick={() => { onSave?.(instructor._id, form); onClose(); }}
            className="flex-1 rounded-lg bg-brand-cta py-2 text-sm font-bold text-white hover:brightness-95"
          >Save Changes</button>
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </aside>
    </div>
  );
};

// DEPARTMENTS is now computed from real data in the component

const AdminInstructorPage = () => {
  const { data: users, loading, refresh } = useFetch(() => api.get("/users?role=instructor"), []);
  const { data: batches } = useFetch(() => api.get("/batches"), []);
  const { data: courses } = useFetch(() => api.get("/courses"), []);
  const { data: instStats } = useFetch(() => api.get("/analytics/instructor-stats"), []);

  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "instructor" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PER_PAGE = 5;

  const instructors = useMemo(() => {
    const arr = Array.isArray(users) ? users : [];
    const statsMap = instStats && typeof instStats === "object" ? instStats : {};
    return arr.map((u) => {
      const s = statsMap[String(u._id)] || {};
      // Derive subjects from courses they teach
      const instCourses = Array.isArray(courses)
        ? courses.filter((c) => String(c.instructor?._id || c.instructor) === String(u._id))
        : [];
      const subjectTags = [...new Set(instCourses.flatMap((c) => c.tags || []).slice(0, 3))];
      const instBatches = Array.isArray(batches)
        ? batches.filter((b) => String(b.mentor?._id || b.mentor) === String(u._id))
        : [];
      return {
        ...u,
        _batches: s.batchCount ?? instBatches.length,
        _batchNames: instBatches.map((b) => b.name),
        _courses: s.courseCount ?? instCourses.length,
        _courseTitles: instCourses.map((c) => c.title).slice(0, 2),
        _rating: s.avgRating ?? null,
        _status: "active",
        _subjects: subjectTags.length ? subjectTags.join(", ") : instCourses.map((c) => c.title).slice(0, 2).join(", ") || "—",
      };
    });
  }, [users, batches, courses, instStats]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return instructors.filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [instructors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const createInstructor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", addForm);
      toast.success("Instructor created");
      setAddForm({ name: "", email: "", password: "", role: "instructor" });
      setShowAdd(false);
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Create failed"); }
  };

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate this instructor?")) return;
    try { await api.delete(`/users/${id}`); toast.success("Deactivated"); refresh(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <Loader label="Loading instructors..." />;

  return (
    <>
      {selected ? <DetailPanel instructor={selected} onClose={() => setSelected(null)} onSave={() => { }} /> : null}

      {/* Add instructor modal */}
      {showAdd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <form onSubmit={createInstructor} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <h3 className="text-lg font-bold text-brand-ink">Add Instructor</h3>
            <div className="mt-4 space-y-3">
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Full name" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              <input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="Email" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
              <input value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Temporary password" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-brand-cta py-2.5 text-sm font-bold text-white hover:brightness-95">Create</button>
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-200 px-4 text-sm font-medium">Cancel</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Breadcrumb + header */}
        <div>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mt-0.5 text-sm text-slate-500">Manage institutional staff, department assignments, and professional records.</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-bold text-white hover:brightness-95">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
              Add Instructor
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Total Faculty", value: instructors.length, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>, sub: "All Departments" },
            { label: "Total Courses", value: Array.isArray(courses) ? courses.filter((c) => instructors.some((inst) => String(inst._id) === String(c.instructor?._id || c.instructor))).length : 0, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>, sub: "Instructor-Led" }
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">{s.icon}</div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className="mt-0.5 text-2xl font-bold text-brand-ink">{s.value}</p>
                <p className="text-[11px] text-slate-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search instructors..."
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} Instructors</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3 text-left">Instructor</th>
                  <th className="px-5 py-3 text-left">Subjects</th>
                  <th className="px-5 py-3 text-left">Assigned Batches</th>
                  <th className="px-5 py-3 text-left">Performance</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((inst, i) => {
                  const col = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const statusKey = inst._status || "active";
                  return (
                    <tr key={inst._id} className="hover:bg-slate-50/50">
                      {/* Instructor */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${col} text-xs font-bold text-white`}>
                            {inst.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-ink">{inst.name}</p>
                            <p className="text-[11px] text-slate-500">{inst.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Subjects / Course titles */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {inst._courseTitles?.length > 0 ? (
                            inst._courseTitles.map((t) => (
                              <span key={t} className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand-primary max-w-[120px] truncate" title={t}>{t}</span>
                            ))
                          ) : inst._subjects && inst._subjects !== "—" ? (
                            inst._subjects.split(", ").slice(0, 2).map((s) => (
                              <span key={s} className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand-primary">{s}</span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No courses</span>
                          )}
                        </div>
                      </td>

                      {/* Batches */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {inst._batchNames?.length > 0 ? (
                            inst._batchNames.slice(0, 3).map((name) => (
                              <span key={name} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                {name}
                              </span>
                            ))
                          ) : inst._batches > 0 ? (
                            <span className="text-[10px] text-slate-500">{inst._batches} batch{inst._batches > 1 ? "es" : ""}</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="px-5 py-3.5">
                        {inst._rating !== null ? (
                          <PerfBar value={inst._rating} />
                        ) : (
                          <span className="text-xs text-slate-400">No reviews</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[statusKey]}`}>
                          {statusKey}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setSelected(inst)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-primary">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!paginated.length ? (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">No instructors found</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 disabled:opacity-40 hover:text-brand-ink">
              ‹ Previous
            </button>
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
              className="flex items-center gap-1 disabled:opacity-40 hover:text-brand-ink">
              Next ›
            </button>
          </div>
        </div>

        {/* Summary cards derived from real instructor data */}
        {(() => {
          const totalInst = instructors.length;
          const withBatches = instructors.filter((i) => i._batches > 0).length;
          const withCourses = instructors.filter((i) => i._courses > 0).length;
          const rated = instructors.filter((i) => i._rating !== null);
          const avgRating = rated.length
            ? (rated.reduce((s, i) => s + i._rating, 0) / rated.length).toFixed(1)
            : null;

          const cards = [
            {
              name: "Batch Coverage",
              subtitle: `${withBatches} of ${totalInst} instructors assigned to batches`,
              metrics: [
                { label: "Assigned Instructors", pct: totalInst ? Math.round((withBatches / totalInst) * 100) : 0 },
                { label: "Unassigned Instructors", pct: totalInst ? Math.round(((totalInst - withBatches) / totalInst) * 100) : 0 }
              ]
            },
            {
              name: "Course Assignment",
              subtitle: `${withCourses} of ${totalInst} instructors teaching courses`,
              metrics: [
                { label: "With Courses", pct: totalInst ? Math.round((withCourses / totalInst) * 100) : 0 },
                { label: "Without Courses", pct: totalInst ? Math.round(((totalInst - withCourses) / totalInst) * 100) : 0 }
              ]
            },
            {
              name: "Rating Overview",
              subtitle: avgRating ? `Avg. rating ${avgRating} / 5 across ${rated.length} rated instructors` : "No reviews yet",
              metrics: [
                { label: "Rated by Students", pct: totalInst ? Math.round((rated.length / totalInst) * 100) : 0 },
                { label: "Avg Score", pct: avgRating ? Math.round((parseFloat(avgRating) / 5) * 100) : 0 }
              ]
            }
          ];

          return (
            <div className="grid gap-4 md:grid-cols-3">
              {cards.map((dept, i) => {
                const acc = DEPT_ACCENT[i % DEPT_ACCENT.length];
                return (
                  <div key={dept.name} className={`rounded-2xl border ${acc.border} ${acc.bg} p-5`}>
                    <p className={`text-sm font-bold ${acc.text}`}>{dept.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{dept.subtitle}</p>
                    <div className="mt-4 space-y-2.5">
                      {dept.metrics.map((m) => (
                        <div key={m.label}>
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">{m.label}</span>
                            <span className="font-semibold text-brand-ink">{m.pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/60">
                            <div className={`h-full rounded-full ${acc.bar}`} style={{ width: `${m.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </>
  );
};

export default AdminInstructorPage;
