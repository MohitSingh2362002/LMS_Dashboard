import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await login(form);
      toast.success("Logged in successfully");
      const fallback = `/${user.role}`;
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(140deg,#0f172a_0%,#115e59_45%,#f59e0b_130%)] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.45em] text-amber-200">Learning Management System</p>
          <h1 className="mt-6 font-display text-5xl leading-tight">Operate courses, cohorts, and live learning from one command center.</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75">
            Admins manage the catalog, instructors handle delivery, and learners move through rich course content with progress, reviews, and live rooms.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[32px] bg-white p-8 text-slate-900 shadow-panel">
          <h2 className="font-display text-3xl">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">Choose your role before logging in.</p>
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-2">
            {["admin", "instructor", "learner"].map((role) => (
              <button
                type="button"
                key={role}
                className={`rounded-2xl px-4 py-3 text-sm font-medium capitalize ${
                  form.role === role ? "bg-slate-900 text-white" : "text-slate-500"
                }`}
                onClick={() => setForm({ ...form, role })}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-teal-700 px-4 py-3 font-medium text-white"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <p className="mt-4 text-sm text-slate-500">
            New learner? <Link to="/register" className="font-semibold text-teal-700">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
