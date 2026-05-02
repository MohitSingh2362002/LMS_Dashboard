import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { formatDate } from "../../utils/helpers";

const AdminUsersPage = () => {
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "instructor", linkedLearners: [] });
  const { data: users, loading, refresh } = useFetch(
    () => api.get(roleFilter ? `/users?role=${roleFilter}` : "/users"),
    [roleFilter]
  );
  const { data: learnerOptions, loading: loadingLearners } = useFetch(() => api.get("/users?role=learner"), []);

  const instructorCount = useMemo(() => users.filter((user) => user.role === "instructor").length, [users]);

  const toggleLinkedLearner = (learnerId) => {
    const exists = form.linkedLearners.includes(learnerId);
    setForm({
      ...form,
      linkedLearners: exists
        ? form.linkedLearners.filter((id) => id !== learnerId)
        : [...form.linkedLearners, learnerId]
    });
  };

  const createUser = async (event) => {
    event.preventDefault();
    try {
      await api.post("/users", form);
      toast.success("User created");
      setForm({ name: "", email: "", password: "", role: "instructor", linkedLearners: [] });
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create user");
    }
  };

  const deactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user?")) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deactivated");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to deactivate user");
    }
  };

  if (loading || loadingLearners) return <Loader label="Loading users..." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.7fr,1.3fr]">
        <form onSubmit={createUser} className="rounded-[28px] bg-white p-6 shadow-panel">
          <h2 className="font-display text-2xl">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500">Admins can add instructors, learners, and linked parent accounts.</p>
          <div className="mt-5 space-y-4">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 capitalize" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, linkedLearners: [] })}>
              <option value="instructor">Instructor</option>
              <option value="learner">Learner</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          {form.role === "parent" ? (
            <div className="mt-5 max-h-52 space-y-2 overflow-y-auto rounded-3xl border border-slate-100 p-3">
              <p className="px-3 text-xs uppercase tracking-[0.2em] text-slate-400">Link learners</p>
              {learnerOptions.map((learner) => (
                <label key={learner._id} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.linkedLearners.includes(learner._id)}
                    onChange={() => toggleLinkedLearner(learner._id)}
                  />
                  <span>{learner.name}</span>
                </label>
              ))}
              {!learnerOptions.length ? <p className="px-3 text-sm text-slate-500">Create learners first, then link them here.</p> : null}
            </div>
          ) : null}
          <button className="mt-5 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            Create Account
          </button>
          <p className="mt-4 text-sm text-slate-500">{instructorCount} instructors currently visible in the filtered list.</p>
        </form>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">User Management</h2>
              <p className="mt-2 text-sm text-slate-500">Filter and manage learner and instructor access.</p>
            </div>
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              <option value="learner">Learners</option>
              <option value="instructor">Instructors</option>
              <option value="parent">Parents</option>
            </select>
          </div>

          {!users.length ? (
            <div className="mt-6">
              <EmptyState title="No users found" description="Adjust the filter or create a new instructor account." />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Linked Learners</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-t border-slate-100">
                      <td className="py-4 font-medium">{user.name}</td>
                      <td className="py-4 text-slate-500">{user.email}</td>
                      <td className="py-4 capitalize">{user.role}</td>
                      <td className="py-4 text-slate-500">
                        {user.role === "parent"
                          ? user.linkedLearners?.map((learner) => learner.name).join(", ") || "None"
                          : "-"}
                      </td>
                      <td className="py-4 text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="py-4">
                        <button className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600" onClick={() => deactivateUser(user._id)}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminUsersPage;
