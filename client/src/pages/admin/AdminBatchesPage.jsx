import { useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const emptyForm = {
  name: "",
  course: "",
  mentor: "",
  learners: [],
  performanceGroup: "foundation",
  status: "active"
};

const performanceGroups = ["foundation", "growth", "merit", "ranker"];
const statuses = ["active", "archived"];

const TRACK_PILL = {
  foundation: "bg-brand-surface text-brand-primary",
  growth: "bg-emerald-100 text-emerald-700",
  merit: "bg-amber-100 text-amber-700",
  ranker: "bg-violet-100 text-violet-700"
};

// ── Batch Detail Modal ──────────────────────────────────────────────
const BatchDetailModal = ({ batch, onClose, onEdit }) => {
  if (!batch) return null;
  const trackClass = TRACK_PILL[batch.performanceGroup] || TRACK_PILL.foundation;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-brand-ink">{batch.name}</h3>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${trackClass}`}>{batch.performanceGroup}</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{batch.status}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Course</p>
              <p className="mt-0.5 text-sm font-semibold text-brand-ink">{batch.course?.title || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Mentor</p>
              <p className="mt-0.5 text-sm font-semibold text-brand-ink">{batch.mentor?.name || "Unassigned"}</p>
              {batch.mentor?.email ? <p className="text-[11px] text-slate-500">{batch.mentor.email}</p> : null}
            </div>
          </div>

          {/* Learners */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Learners ({batch.learners?.length || 0})
              </p>
            </div>
            {batch.learners?.length ? (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-1">
                {batch.learners.map((l, i) => (
                  <div key={l._id || i} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary">
                      {(l.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">{l.name || "—"}</p>
                      <p className="truncate text-[10px] text-slate-500">{l.email || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No learners enrolled yet.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-[11px] text-slate-400">Updated {formatDate(batch.updatedAt)}</p>
          <button onClick={() => { onClose(); onEdit(batch); }}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
            Edit Batch
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminBatchesPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [viewingBatch, setViewingBatch] = useState(null);
  const [filters, setFilters] = useState({ status: "active", performanceGroup: "" });
  const [learnerSearch, setLearnerSearch] = useState("");

  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => Boolean(v))
  ).toString();

  const { data: batches, loading: lb, refresh } = useFetch(() => api.get(query ? `/batches?${query}` : "/batches"), [query]);
  const { data: courses, loading: lc } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: lu } = useFetch(() => api.get("/users"), []);

  const instructors = useMemo(() => users.filter((u) => u.role === "instructor"), [users]);
  const learners = useMemo(() => users.filter((u) => u.role === "learner"), [users]);
  const filteredLearners = useMemo(
    () => learners.filter((l) => `${l.name} ${l.email}`.toLowerCase().includes(learnerSearch.toLowerCase())),
    [learners, learnerSearch]
  );

  const resetForm = () => { setForm(emptyForm); setEditingId(""); setLearnerSearch(""); };

  const startEdit = (b) => {
    setEditingId(b._id);
    setForm({
      name: b.name || "", course: b.course?._id || "", mentor: b.mentor?._id || "",
      learners: b.learners?.map((l) => l._id) || [],
      performanceGroup: b.performanceGroup || "foundation",
      status: b.status || "active"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitBatch = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await api.put(`/batches/${editingId}`, form); toast.success("Batch updated"); }
      else { await api.post("/batches", form); toast.success("Batch created"); }
      resetForm(); refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
  };

  const toggleLearner = (id) => {
    const exists = form.learners.includes(id);
    setForm({ ...form, learners: exists ? form.learners.filter((x) => x !== id) : [...form.learners, id] });
  };

  if (lb || lc || lu) return <Loader label="Loading batches..." />;

  const activeBatches = Array.isArray(batches) ? batches : [];

  return (
    <>
    {viewingBatch ? (
      <BatchDetailModal
        batch={viewingBatch}
        onClose={() => setViewingBatch(null)}
        onEdit={(b) => { startEdit(b); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />
    ) : null}
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        {/* Create form */}
        <form onSubmit={submitBatch} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
          <h2 className="text-xl font-bold text-brand-ink">{editingId ? "Edit Batch" : "Create New Batch"}</h2>
          <p className="mt-1 text-xs text-slate-500">Set up your teaching schedule and student groups.</p>

          <div className="mt-5 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Batch Name</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                placeholder="e.g. 12th Class - Science - Morning"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Select Course</label>
                <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="">Computer Science</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Select Mentor</label>
                <select value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="">Dr. Sarah Miller</option>
                  {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Track</label>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {performanceGroups.slice(0, 2).map((g) => (
                  <button key={g} type="button"
                    onClick={() => setForm({ ...form, performanceGroup: g })}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      form.performanceGroup === g ? "bg-white text-brand-primary shadow-sm" : "text-slate-500"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Learner Selection</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input value={learnerSearch} onChange={(e) => setLearnerSearch(e.target.value)} placeholder="Search learners..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400" />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-100">
              {filteredLearners.slice(0, 10).map((l) => {
                const checked = form.learners.includes(l._id);
                return (
                  <label key={l._id} className="flex items-center gap-3 border-b border-slate-50 px-3 py-2 last:border-0 hover:bg-slate-50">
                    <input type="checkbox" checked={checked} onChange={() => toggleLearner(l._id)} className="rounded border-slate-300 text-brand-accent" />
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary">
                      {l.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-brand-ink">{l.name}</p>
                      <p className="truncate text-[10px] text-slate-500">ID: {l._id?.slice(-8).toUpperCase()}</p>
                    </div>
                  </label>
                );
              })}
              {!filteredLearners.length ? <p className="px-3 py-3 text-xs text-slate-500">No learners found.</p> : null}
            </div>
          </div>

          <button type="submit" className="mt-5 w-full rounded-lg bg-brand-cta px-4 py-3 text-sm font-semibold text-white hover:brightness-95">
            {editingId ? "Save Batch" : "Create Batch"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          ) : null}
        </form>

        {/* Active batches */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold text-brand-ink">Active Batches</h2>
              <span className="rounded-md bg-brand-ink px-2 py-0.5 text-xs font-bold text-white">{activeBatches.length} TOTAL</span>
            </div>
            <div className="flex gap-2">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium capitalize">
                <option value="">Status: All</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.performanceGroup} onChange={(e) => setFilters({ ...filters, performanceGroup: e.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium capitalize">
                <option value="">Group: All</option>
                {performanceGroups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {!activeBatches.length ? (
            <EmptyState title="No batches found" description="Adjust filters or create a new batch." />
          ) : (
            <div className="space-y-3">
              {activeBatches.map((b) => {
                const trackClass = TRACK_PILL[b.performanceGroup] || TRACK_PILL.foundation;
                return (
                  <div key={b._id}
                    className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition-all hover:shadow-cardHover">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {b.status === "active" ? "Active" : b.status}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${trackClass}`}>
                        {b.performanceGroup}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-brand-ink">{b.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                        {b.course?.title || "—"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" /></svg>
                        {b.mentor?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                        <span className="font-semibold text-brand-ink">{b.learners?.length || 0}</span> Learners
                        <span className="ml-3">Updated {formatDate(b.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => { startEdit(b); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className="text-xs font-medium text-slate-500 hover:text-brand-ink hover:underline">
                          Edit
                        </button>
                        <button onClick={() => setViewingBatch(b)}
                          className="text-xs font-semibold text-brand-accent hover:underline">
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
    </>
  );
};

export default AdminBatchesPage;
