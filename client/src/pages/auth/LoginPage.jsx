import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

// ── Role config ───────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: "learner", label: "Learner",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422A12 12 0 0118.77 17.5H5.23a12 12 0 00.61-6.922L12 14z"/></svg>,
  },
  {
    id: "instructor", label: "Instructor",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: "admin", label: "Admin",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    id: "parent", label: "Parent",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
];

const IcEye = ({ open }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [form,    setForm]    = useState({ email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_expired") === "1") {
      toast("You were signed out because your account was used on another device.", { icon: "🔒", duration: 6000 });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      toast.success("Logged in successfully");
      navigate(location.state?.from?.pathname || `/${user.role}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const activeRole = ROLES.find(r => r.id === form.role);

  // ── Shared role selector (used in both layouts) ──────────────────────────────
  const RoleSelectorDesktop = () => (
    <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 sm:grid-cols-4">
      {ROLES.map((role) => (
        <button
          type="button" key={role.id}
          className={`rounded-2xl px-4 py-3 text-sm font-medium capitalize ${
            form.role === role.id ? "bg-slate-900 text-white" : "text-slate-500"
          }`}
          onClick={() => setForm(f => ({ ...f, role: role.id }))}
        >
          {role.label}
        </button>
      ))}
    </div>
  );

  const RoleSelectorMobile = () => (
    <div className="grid grid-cols-4 gap-2">
      {ROLES.map((role) => {
        const active = form.role === role.id;
        return (
          <button
            key={role.id} type="button"
            onClick={() => setForm(f => ({ ...f, role: role.id }))}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-[10px] font-semibold transition-all duration-200 ${
              active
                ? "border-brand-accent bg-brand-surface text-brand-accent shadow-md scale-[1.04]"
                : "border-slate-100 bg-slate-50 text-slate-400"
            }`}
          >
            <span className={active ? "text-brand-accent" : "text-slate-400"}>{role.icon}</span>
            {role.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════════
          DESKTOP  (lg and above) — original layout, untouched
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block min-h-screen bg-[linear-gradient(140deg,#0f172a_0%,#115e59_45%,#f59e0b_130%)] px-4 py-10 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.45em] text-amber-200">Learning Management System</p>
            <h1 className="mt-6 font-display text-5xl leading-tight">
              Operate courses, cohorts, and live learning from one command center.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/75">
              Admins manage the catalog, instructors handle delivery, and learners move through rich course content with progress, reviews, and live rooms.
            </p>
          </div>

          <form onSubmit={submit} className="rounded-[32px] bg-white p-8 text-slate-900 shadow-panel">
            <h2 className="font-display text-3xl">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Choose your role before logging in.</p>
            <RoleSelectorDesktop />
            <div className="mt-6 space-y-4">
              <input
                type="email" placeholder="Email" required autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
              <input
                type="password" placeholder="Password" required autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="mt-6 w-full rounded-2xl bg-teal-700 px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
            <p className="mt-4 text-sm text-slate-500">
              New learner?{" "}
              <Link to="/register" className="font-semibold text-teal-700">Create an account</Link>
            </p>
          </form>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MOBILE  (below lg) — native-app style redesign
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex min-h-screen flex-col overflow-hidden bg-brand-ink lg:hidden">

        {/* Background blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-brand-accent opacity-20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-primary opacity-25 blur-3xl" />
        </div>

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3 px-6 pt-14 pb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-accent shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-6 w-6">
              <path d="M12 14l9-5-9-5-9 5 9 5z"/>
              <path d="M12 14l6.16-3.422A12 12 0 0118.77 17.5H5.23a12 12 0 00.61-6.922L12 14z"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-bold leading-none text-white">EduMaster</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-brand-accent/80">Learning Platform</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 px-6 pt-10 pb-8">
          <h1 className="text-[2rem] font-bold leading-tight text-white">Welcome back 👋</h1>
          <p className="mt-1.5 text-sm text-slate-400">Sign in to continue your learning journey</p>
        </div>

        {/* White sheet card */}
        <div className="relative z-10 flex-1 rounded-t-[2rem] bg-white px-6 pt-8 pb-10 shadow-2xl">

          {/* Role tiles */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">I am a</p>
          <RoleSelectorMobile />

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">Sign in as {activeRole?.label}</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email address</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  type="email" required autoComplete="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-brand-accent focus:bg-white focus:shadow-[0_0_0_4px_rgba(46,127,217,0.08)]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500">Password</label>
                <button type="button" className="text-xs font-semibold text-brand-accent">Forgot password?</button>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPwd ? "text" : "password"} required autoComplete="current-password" placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 placeholder:text-slate-300 outline-none transition focus:border-brand-accent focus:bg-white focus:shadow-[0_0_0_4px_rgba(46,127,217,0.08)]"
                />
                <button
                  type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <IcEye open={showPwd} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="mt-2 w-full rounded-2xl bg-brand-primary py-4 text-sm font-bold text-white shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : `Sign in as ${activeRole?.label}`}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New learner?{" "}
            <Link to="/register" className="font-semibold text-brand-accent">Create an account</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
