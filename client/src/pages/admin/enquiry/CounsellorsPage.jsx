import { useEffect, useState } from "react";
import api from "../../../api/client";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-teal-500 to-emerald-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
];

function avatarGradient(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function formatJoinDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const initForm = { name: "", email: "", password: "", isActive: true };

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function CounsellorsPage() {
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(initForm);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const load = () => {
    setLoading(true);
    api.get("/leads/counsellors")
      .then(({ data }) => setCounsellors(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name     = "Name is required";
    if (!form.email.trim()) errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password)     errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Minimum 6 characters";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setSaving(true); setError(""); setFieldErrors({});
    try {
      await api.post("/users", { ...form, role: "counsellor" });
      setShowModal(false);
      setForm(initForm);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create counsellor");
    } finally { setSaving(false); }
  };

  const toggleActive = async (c) => {
    await api.put(`/users/${c._id}`, { isActive: !c.isActive });
    load();
  };

  const openCreate = () => {
    setShowModal(true);
    setForm(initForm);
    setError("");
    setFieldErrors({});
  };

  const activeCnt = counsellors.filter((c) => c.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink tracking-tight">Counsellors</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage counsellor accounts and lead assignments</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-all shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
          Add Counsellor
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <StatCard
            label="Total Counsellors"
            value={counsellors.length}
            color="bg-brand-primary/10 text-brand-primary"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            label="Active"
            value={activeCnt}
            color="bg-green-50 text-green-600"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="h-8 w-8 rounded-full border-[3px] border-brand-primary border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading counsellors…</p>
        </div>
      ) : counsellors.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-24 w-24 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="h-12 w-12 text-slate-300">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700">No counsellors yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">Add your first counsellor to start assigning leads and managing your team.</p>
          <button
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
            Add First Counsellor
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {counsellors.map((c) => {
            const grad = avatarGradient(c.name);
            const ini  = initials(c.name);
            return (
              <div
                key={c._id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden"
              >
                {/* Card top accent line */}
                <div className={`h-1 w-full bg-gradient-to-r ${grad}`} />

                <div className="p-5">
                  {/* Avatar + toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm`}>
                      {ini}
                    </div>
                    <button
                      onClick={() => toggleActive(c)}
                      title={c.isActive ? "Click to deactivate" : "Click to activate"}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        c.isActive
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {/* Name + email */}
                  <div className="mt-3">
                    <p className="font-bold text-slate-900 text-base leading-tight">{c.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{c.email}</p>
                  </div>

                  {/* Meta row */}
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Joined {formatJoinDate(c.createdAt)}
                    </div>
                    {typeof c.leadCount === "number" && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        {c.leadCount} leads
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create counsellor modal ──────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add Counsellor</h2>
                  <p className="text-xs text-slate-400">Create a new counsellor account</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {/* Global error */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors({ ...fieldErrors, name: "" }); }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-shadow ${
                    fieldErrors.name
                      ? "border-red-300 bg-red-50/30 focus:ring-red-200"
                      : "border-slate-200 focus:ring-brand-primary/30"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setFieldErrors({ ...fieldErrors, email: "" }); }}
                  placeholder="e.g. rahul@institute.com"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-shadow ${
                    fieldErrors.email
                      ? "border-red-300 bg-red-50/30 focus:ring-red-200"
                      : "border-slate-200 focus:ring-brand-primary/30"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors({ ...fieldErrors, password: "" }); }}
                  placeholder="Min. 6 characters"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-shadow ${
                    fieldErrors.password
                      ? "border-red-300 bg-red-50/30 focus:ring-red-200"
                      : "border-slate-200 focus:ring-brand-primary/30"
                  }`}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{fieldErrors.password}</p>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Active account</p>
                  <p className="text-xs text-slate-400 mt-0.5">Counsellor can log in immediately</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isActive ? "bg-brand-primary" : "bg-slate-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {/* Submit */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
                    Create Counsellor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
