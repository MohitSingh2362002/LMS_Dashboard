import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import CourseFormModal from "../../components/CourseFormModal";
import { formatDate, getFullImageUrl, stripHtml } from "../../utils/helpers";

const AdminCoursesPage = () => {
  const { data: courses, loading, refresh } = useFetch(() => api.get("/courses"), []);
  const { data: users } = useFetch(() => api.get("/users?role=instructor"), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const instructors = useMemo(() => users.filter((user) => user.role === "instructor"), [users]);

  const submit = async (formData) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/courses/${editing._id}`, formData);
        toast.success("Course updated");
      } else {
        await api.post("/courses", formData);
        toast.success("Course created");
      }
      setOpen(false);
      setEditing(null);
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save course");
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async (courseId) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await api.delete(`/courses/${courseId}`);
      toast.success("Course deleted");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const duplicateCourse = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/duplicate`);
      toast.success("Course duplicated");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Duplicate failed");
    }
  };

  if (loading) return <Loader label="Loading courses..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-slate-900">Course Management</h2>
          <p className="mt-2 text-sm text-slate-500">Create, edit, duplicate, and publish the learning catalog.</p>
        </div>
        <button
          className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Create Course
        </button>
      </div>

      {!courses.length ? (
        <EmptyState
          title="No courses yet"
          description="Start by creating your first course with rich details, chapters, pricing, and advanced settings."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course._id} className="overflow-hidden rounded-[28px] bg-white shadow-panel">
              <div className="h-48 bg-slate-100">
                {course.thumbnail ? (
                  <img
                    src={getFullImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-teal-100 font-display text-3xl text-slate-700">
                    {course.title.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl">{course.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{course.instructorDisplayName || course.instructor?.name || "Unassigned instructor"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {course.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">{stripHtml(course.tagline || course.description)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.tags?.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <p>Created: {formatDate(course.createdAt)}</p>
                  <p>Updated: {formatDate(course.updatedAt)}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => { setEditing(course); setOpen(true); }}>
                    Edit
                  </button>
                  <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => duplicateCourse(course._id)}>
                    Duplicate
                  </button>
                  <button className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600" onClick={() => removeCourse(course._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
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
