import { useMemo, useState } from "react";
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

const AdminBatchesPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ status: "active", performanceGroup: "" });
  const [learnerSearch, setLearnerSearch] = useState("");
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ).toString();

  const { data: batches, loading: loadingBatches, refresh } = useFetch(
    () => api.get(query ? `/batches?${query}` : "/batches"),
    [query]
  );
  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: users, loading: loadingUsers } = useFetch(() => api.get("/users"), []);

  const instructors = useMemo(() => users.filter((user) => user.role === "instructor"), [users]);
  const learners = useMemo(() => users.filter((user) => user.role === "learner"), [users]);
  const filteredLearners = useMemo(
    () =>
      learners.filter((learner) =>
        `${learner.name} ${learner.email}`.toLowerCase().includes(learnerSearch.toLowerCase())
      ),
    [learners, learnerSearch]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setLearnerSearch("");
  };

  const startEdit = (batch) => {
    setEditingId(batch._id);
    setForm({
      name: batch.name || "",
      course: batch.course?._id || "",
      mentor: batch.mentor?._id || "",
      learners: batch.learners?.map((learner) => learner._id) || [],
      performanceGroup: batch.performanceGroup || "foundation",
      status: batch.status || "active"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitBatch = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/batches/${editingId}`, form);
        toast.success("Batch updated");
      } else {
        await api.post("/batches", form);
        toast.success("Batch created");
      }
      resetForm();
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save batch");
    }
  };

  const toggleLearner = (learnerId) => {
    const exists = form.learners.includes(learnerId);
    setForm({
      ...form,
      learners: exists
        ? form.learners.filter((id) => id !== learnerId)
        : [...form.learners, learnerId]
    });
  };

  const updateBatchStatus = async (batch, status) => {
    try {
      await api.put(`/batches/${batch._id}`, {
        name: batch.name,
        course: batch.course?._id,
        mentor: batch.mentor?._id,
        learners: batch.learners?.map((learner) => learner._id) || [],
        performanceGroup: batch.performanceGroup,
        status
      });
      toast.success(status === "archived" ? "Batch archived" : "Batch reactivated");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update batch");
    }
  };

  if (loadingBatches || loadingCourses || loadingUsers) {
    return <Loader label="Loading batches..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Command Center</p>
        <h2 className="font-display text-3xl text-slate-900">Batch Operations</h2>
        <p className="mt-2 text-sm text-slate-500">
          Assign courses, mentors, learners, status, and performance groups from one focused workspace.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
        <form onSubmit={submitBatch} className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl">{editingId ? "Edit Batch" : "Create Batch"}</h3>
            {editingId ? (
              <button type="button" className="rounded-2xl border px-4 py-2 text-sm font-medium" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Batch name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} required>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.mentor} onChange={(event) => setForm({ ...form, mentor: event.target.value })} required>
              <option value="">Select mentor</option>
              {instructors.map((instructor) => <option key={instructor._id} value={instructor._id}>{instructor.name}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={form.performanceGroup} onChange={(event) => setForm({ ...form, performanceGroup: event.target.value })}>
                {performanceGroups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Search learners"
              value={learnerSearch}
              onChange={(event) => setLearnerSearch(event.target.value)}
            />
          </div>

          <div className="mt-5 max-h-64 space-y-2 overflow-y-auto rounded-3xl border border-slate-100 p-3">
            {filteredLearners.map((learner) => (
              <label key={learner._id} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={form.learners.includes(learner._id)} onChange={() => toggleLearner(learner._id)} />
                <span>{learner.name}</span>
                <span className="text-slate-400">{learner.email}</span>
              </label>
            ))}
            {!filteredLearners.length ? <p className="px-3 py-2 text-sm text-slate-500">No learners match this search.</p> : null}
          </div>

          <button className="mt-5 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            {editingId ? "Save Batch" : "Create Batch"}
          </button>
        </form>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl">Batches</h3>
            <div className="flex flex-wrap gap-2">
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm capitalize" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                <option value="">All status</option>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm capitalize" value={filters.performanceGroup} onChange={(event) => setFilters({ ...filters, performanceGroup: event.target.value })}>
                <option value="">All groups</option>
                {performanceGroups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
          </div>

          {!batches.length ? (
            <div className="mt-6">
              <EmptyState title="No batches found" description="Adjust filters or create a new batch." />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {batches.map((batch) => (
                <div key={batch._id} className="rounded-3xl border border-slate-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{batch.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{batch.course?.title} · {batch.mentor?.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{batch.performanceGroup}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${batch.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {batch.status}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-500">
                    {batch.learners?.length || 0} learners · Updated {formatDate(batch.updatedAt)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={() => startEdit(batch)}>
                      Edit
                    </button>
                    {batch.status === "active" ? (
                      <button className="rounded-2xl border border-amber-200 px-4 py-3 text-sm font-medium text-amber-700" onClick={() => updateBatchStatus(batch, "archived")}>
                        Archive
                      </button>
                    ) : (
                      <button className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700" onClick={() => updateBatchStatus(batch, "active")}>
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminBatchesPage;
