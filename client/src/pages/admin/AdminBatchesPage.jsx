import { useEffect, useMemo, useState, useCallback } from "react";
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
  status: "active",
  thumbnail: "",
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
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${batch.status === "archived" ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>{batch.status}</span>
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
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [editingId, setEditingId] = useState("");
  const [viewingBatch, setViewingBatch] = useState(null);
  const [filters, setFilters] = useState({ status: "active", performanceGroup: "" });
  const [learnerSearch, setLearnerSearch] = useState("");
  const [enrolledLearnerIds, setEnrolledLearnerIds] = useState(null); // null = no filter

  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => Boolean(v))
  ).toString();

  const { data: batches, loading: lb, refresh } = useFetch(() => api.get(query ? `/batches?${query}` : "/batches"), [query]);
  const { data: courses, loading: lc } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: lu } = useFetch(() => api.get("/users"), []);

  const instructors = useMemo(() => users.filter((u) => u.role === "instructor"), [users]);
  const allLearners = useMemo(() => users.filter((u) => u.role === "learner"), [users]);

  // When course changes in form, fetch enrolled learners for that course
  useEffect(() => {
    if (!form.course) {
      setEnrolledLearnerIds(null);
      return;
    }
    api.get(`/enrollments/course/${form.course}`)
      .then(({ data }) => setEnrolledLearnerIds(Array.isArray(data) ? data : []))
      .catch(() => setEnrolledLearnerIds(null));
  }, [form.course]);

  // Learners visible in form — filtered by course enrollment if course selected
  const courseLearners = useMemo(() => {
    if (!enrolledLearnerIds) return allLearners; // no course selected → show all
    return allLearners.filter((l) => enrolledLearnerIds.includes(l._id));
  }, [allLearners, enrolledLearnerIds]);

  const filteredLearners = useMemo(
    () => courseLearners.filter((l) => `${l.name} ${l.email}`.toLowerCase().includes(learnerSearch.toLowerCase())),
    [courseLearners, learnerSearch]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setLearnerSearch("");
    setEnrolledLearnerIds(null);
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  const startEdit = (b) => {
    setEditingId(b._id);
    setForm({
      name: b.name || "", course: b.course?._id || "", mentor: b.mentor?._id || "",
      learners: b.learners?.map((l) => l._id) || [],
      performanceGroup: b.performanceGroup || "foundation",
      status: b.status || "active",
      thumbnail: b.thumbnail || "",
    });
    setThumbnailFile(null);
    setThumbnailPreview(b.thumbnail || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const submitBatch = async (e) => {
    e.preventDefault();
    try {
      let batchId = editingId;
      if (editingId) {
        await api.put(`/batches/${editingId}`, form);
        toast.success("Batch updated");
      } else {
        const { data } = await api.post("/batches", form);
        batchId = data._id;
        toast.success("Batch created");
      }
      // Upload thumbnail separately if a file was chosen
      if (thumbnailFile && batchId) {
        const fd = new FormData();
        fd.append("thumbnail", thumbnailFile);
        await api.patch(`/batches/${batchId}/thumbnail`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      resetForm();
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
  };

  const toggleLearner = (id) => {
    const exists = form.learners.includes(id);
    setForm({ ...form, learners: exists ? form.learners.filter((x) => x !== id) : [...form.learners, id] });
  };

  const toggleArchive = async (b) => {
    const newStatus = b.status === "archived" ? "active" : "archived";
    try {
      await api.put(`/batches/${b._id}`, { status: newStatus });
      toast.success(newStatus === "archived" ? "Batch archived" : "Batch restored");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
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
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value, learners: [] })}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                    <option value="">Select a course…</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Select Mentor</label>
                  <select value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                    <option value="">Select mentor…</option>
                    {instructors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Track</label>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  {performanceGroups.map((g) => (
                    <button key={g} type="button"
                      onClick={() => setForm({ ...form, performanceGroup: g })}
                      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition ${form.performanceGroup === g ? "bg-white text-brand-primary shadow-sm" : "text-slate-500"
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

              {/* Batch Thumbnail */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-ink">Batch Cover Image</label>
                <div className="flex items-start gap-3">
                  {/* Preview */}
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Batch thumbnail"
                        className="h-full w-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-slate-400">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-xs font-medium text-slate-600 hover:border-brand-primary hover:text-brand-primary transition">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {thumbnailFile ? thumbnailFile.name : "Upload image"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                    </label>
                    <p className="mt-1 text-[10px] text-slate-400">JPG, PNG, WebP · Recommended 16:9</p>
                    {thumbnailPreview && (
                      <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(""); setForm({ ...form, thumbnail: "" }); }}
                        className="mt-1 text-[10px] font-medium text-red-500 hover:text-red-700">
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-brand-ink">Learner Selection</label>
                  {form.course && (
                    <span className="text-[10px] text-slate-500">
                      {enrolledLearnerIds === null
                        ? "Loading enrolled…"
                        : enrolledLearnerIds.length === 0
                          ? "No enrolled learners"
                          : `${enrolledLearnerIds.length} enrolled in course`}
                    </span>
                  )}
                  {!form.course && <span className="text-[10px] text-slate-400">Select a course to filter</span>}
                </div>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                  <input value={learnerSearch} onChange={(e) => setLearnerSearch(e.target.value)} placeholder="Search learners..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400" />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-100">
                {filteredLearners.slice(0, 20).map((l) => {
                  const checked = form.learners.includes(l._id);
                  return (
                    <label key={l._id} className="flex items-center gap-3 border-b border-slate-50 px-3 py-2 last:border-0 hover:bg-slate-50">
                      <input type="checkbox" checked={checked} onChange={() => toggleLearner(l._id)} className="rounded border-slate-300 text-brand-accent" />
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary">
                        {l.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold text-brand-ink">{l.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{l.email}</p>
                      </div>
                    </label>
                  );
                })}
                {!filteredLearners.length && (
                  <p className="px-3 py-3 text-xs text-slate-500">
                    {form.course && enrolledLearnerIds?.length === 0
                      ? "No learners enrolled in this course yet."
                      : "No learners found."}
                  </p>
                )}
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
                <h2 className="text-3xl font-bold text-brand-ink">Batches</h2>
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
              <div className="grid gap-5 sm:grid-cols-2">
                {activeBatches.map((b) => {
                  const trackClass = TRACK_PILL[b.performanceGroup] || TRACK_PILL.foundation;
                  const isArchived = b.status === "archived";
                  return (
                    <div key={b._id}
                      className={`group overflow-hidden rounded-2xl border bg-white shadow-card transition-all hover:shadow-cardHover hover:-translate-y-0.5 ${isArchived ? "border-slate-200 opacity-70" : "border-slate-200/70"}`}>
                      {/* Thumbnail — same h-44 as course card */}
                      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-accent to-brand-primary">
                        {b.thumbnail ? (
                          <img
                            src={b.thumbnail}
                            alt={b.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-12 w-12 opacity-40">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                            </svg>
                          </div>
                        )}
                        {/* Status badge */}
                        <span className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isArchived ? "bg-slate-600 text-white" : "bg-emerald-500 text-white"}`}>
                          {b.status}
                        </span>
                        {/* Track badge */}
                        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shadow-sm ${trackClass}`}>
                          {b.performanceGroup}
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-2 text-sm font-bold text-brand-ink leading-snug">{b.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                            <span className="truncate max-w-[120px]">{b.course?.title || "—"}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" /></svg>
                            {b.mentor?.name || "Unassigned"}
                          </span>
                        </div>

                        {/* Learner count + date */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                            <span className="font-semibold text-brand-ink">{b.learners?.length || 0}</span> Learners
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleArchive(b)}
                              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${isArchived
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"}`}
                            >
                              {isArchived ? "Restore" : "Archive"}
                            </button>
                            <button onClick={() => { startEdit(b); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              className="text-xs font-medium text-slate-500 hover:text-brand-ink hover:underline">Edit</button>
                            <button onClick={() => setViewingBatch(b)}
                              className="text-xs font-semibold text-brand-accent hover:underline">View →</button>
                          </div>
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
