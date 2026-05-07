import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import CourseFormModal from "../../components/CourseFormModal";
import { formatDate, getFullImageUrl, stripHtml } from "../../utils/helpers";

const STATUS_BADGE = {
  published: "bg-emerald-500 text-white",
  draft: "bg-amber-500 text-white",
  archived: "bg-slate-500 text-white"
};

const CATEGORY_TAG = {
  development: "bg-emerald-100 text-emerald-700",
  engineering: "bg-blue-100 text-blue-700",
  design: "bg-pink-100 text-pink-700",
  data: "bg-violet-100 text-violet-700",
  default: "bg-slate-100 text-slate-700"
};

const StatTile = ({ label, value, delta, deltaTone, icon, accent = "text-brand-primary" }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-brand-ink">{value}</p>
        {delta ? (
          <p className={`mt-1 text-xs font-medium ${deltaTone === "up" ? "text-emerald-600" : "text-rose-600"}`}>
            {deltaTone === "up" ? "▲" : "▼"} {delta}
          </p>
        ) : null}
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface ${accent}`}>{icon}</div>
    </div>
  </div>
);

const AdminCoursesPage = () => {
  const { data: courses, loading, refresh } = useFetch(() => api.get("/courses"), []);
  const { data: users } = useFetch(() => api.get("/users?role=instructor"), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const instructors = useMemo(() => users.filter((u) => u.role === "instructor"), [users]);

  const filtered = useMemo(() => {
    const arr = Array.isArray(courses) ? courses : [];
    return arr.filter((c) => {
      const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [courses, search, statusFilter]);

  const counts = useMemo(() => {
    const arr = Array.isArray(courses) ? courses : [];
    return {
      total: arr.length,
      active: arr.filter((c) => c.status === "published").length,
      pending: arr.filter((c) => c.status === "draft").length
    };
  }, [courses]);

  const submit = async (formData) => {
    setSaving(true);
    try {
      if (editing) { await api.put(`/courses/${editing._id}`, formData); toast.success("Course updated"); }
      else { await api.post("/courses", formData); toast.success("Course created"); }
      setOpen(false);
      setEditing(null);
      refresh();
    } catch (e) { toast.error(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const removeCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try { await api.delete(`/courses/${id}`); toast.success("Course deleted"); refresh(); }
    catch (e) { toast.error(e.response?.data?.message || "Delete failed"); }
  };

  const duplicateCourse = async (id) => {
    try { await api.post(`/courses/${id}/duplicate`); toast.success("Course duplicated"); refresh(); }
    catch (e) { toast.error(e.response?.data?.message || "Duplicate failed"); }
  };

  const archiveCourse = async (course) => {
    const newStatus = course.status === "archived" ? "published" : "archived";
    const label = newStatus === "archived" ? "archived" : "restored";
    try {
      await api.put(`/courses/${course._id}`, { status: newStatus });
      toast.success(`Course ${label}`);
      refresh();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  if (loading) return <Loader label="Loading courses..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Course Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and organize your studio's curriculum across all departments.</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95"
          onClick={() => { setEditing(null); setOpen(true); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
          Create Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Total Courses" value={counts.total} delta="12% this month" deltaTone="up"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>}
        />
        <StatTile
          label="Activated Courses" value={counts.active} delta="5% this month" deltaTone="up"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-emerald-600"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4l-10 10-3-3" /></svg>}
          accent="text-emerald-600"
        />
        <StatTile
          label="Pending Courses" value={counts.pending} delta="2% this month" deltaTone="down"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-rose-500"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>}
          accent="text-rose-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
        <div className="relative min-w-[260px] flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title, instructor, or ID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          />
        </div>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-ink">
          <option>Category: All</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-ink"
        >
          <option value="all">Status: All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-brand-ink">
          <option>Type: All</option>
        </select>
        <button className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
        </button>
      </div>

      {/* Course grid */}
      {!filtered.length ? (
        <EmptyState title="No courses found" description="Try adjusting filters or create your first course." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => {
            const cat = (course.category || course.tags?.[0] || "default").toLowerCase();
            const tagClass = CATEGORY_TAG[cat] || CATEGORY_TAG.default;
            return (
              <article key={course._id} className="group overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition-all hover:shadow-cardHover">
                <div className="relative h-32 bg-gradient-to-br from-brand-accent to-brand-primary">
                  {course.thumbnail ? (
                    <img
                      src={getFullImageUrl(course.thumbnail)}
                      alt={course.title}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-12 w-12 opacity-70"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[course.status] || STATUS_BADGE.draft}`}>
                    {course.status}
                  </span>
                </div>
                <div className="p-4">
                  <p className={`mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tagClass}`}>{cat}</p>
                  <h3 className="line-clamp-2 text-sm font-bold text-brand-ink">{course.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{stripHtml(course.tagline || course.description) || "—"}</p>

                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary">
                      {(course.instructor?.name || course.instructorDisplayName || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">{course.instructorDisplayName || course.instructor?.name || "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Updated: {formatDate(course.updatedAt)}</span>
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                      {course.enrollmentCount ?? 0}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium hover:bg-slate-50" onClick={() => { setEditing(course); setOpen(true); }}>Edit</button>
                    <button className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium hover:bg-slate-50" onClick={() => duplicateCourse(course._id)}>Duplicate</button>
                    <button
                      className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${course.status === "archived" ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-amber-200 text-amber-600 hover:bg-amber-50"}`}
                      onClick={() => archiveCourse(course)}
                    >
                      {course.status === "archived" ? "Restore" : "Archive"}
                    </button>
                    <button className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50" onClick={() => removeCourse(course._id)}>Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}


      <CourseFormModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSubmit={submit}
        instructors={instructors}
        initialValue={editing}
        loading={saving}
      />
    </div>
  );
};

export default AdminCoursesPage;
