import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxUses: "",
  minAmount: "",
  expiresAt: "",
  isActive: true,
  applicableTo: "all",
};

// ── Stat chip ──────────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-card ${color}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-0.5 text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ active, expired, exhausted }) {
  if (!active)   return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Inactive</span>;
  if (expired)   return <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-600">Expired</span>;
  if (exhausted) return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">Exhausted</span>;
  return           <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">Active</span>;
}

function isExpired(code)   { return code.expiresAt && new Date() > new Date(code.expiresAt); }
function isExhausted(code) { return code.maxUses > 0 && code.usedCount >= code.maxUses; }

export default function AdminPromoCodesPage() {
  const [codes,   setCodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  // Modal state
  const [modal,   setModal]   = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null); // promo code object
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);

  // Delete confirm
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/promo-codes");
      setCodes(data);
    } catch {
      toast.error("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setModal("create");
  };

  const openEdit = (code) => {
    setEditing(code);
    setForm({
      code:          code.code,
      description:   code.description   || "",
      discountType:  code.discountType,
      discountValue: code.discountValue,
      maxUses:       code.maxUses       || "",
      minAmount:     code.minAmount     || "",
      expiresAt:     code.expiresAt ? code.expiresAt.slice(0, 10) : "",
      isActive:      code.isActive,
      applicableTo:  code.applicableTo  || "all",
    });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Code is required");
    if (!form.discountValue || isNaN(+form.discountValue)) return toast.error("Discount value is required");

    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: +form.discountValue,
        maxUses:       form.maxUses   !== "" ? +form.maxUses   : 0,
        minAmount:     form.minAmount !== "" ? +form.minAmount : 0,
        expiresAt:     form.expiresAt || null,
      };

      if (modal === "create") {
        const { data } = await api.post("/promo-codes", payload);
        setCodes((prev) => [data, ...prev]);
        toast.success("Promo code created!");
      } else {
        const { data } = await api.put(`/promo-codes/${editing._id}`, payload);
        setCodes((prev) => prev.map((c) => c._id === data._id ? data : c));
        toast.success("Promo code updated!");
      }
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code) => {
    try {
      await api.delete(`/promo-codes/${code._id}`);
      setCodes((prev) => prev.filter((c) => c._id !== code._id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (code) => {
    try {
      const { data } = await api.put(`/promo-codes/${code._id}`, { isActive: !code.isActive });
      setCodes((prev) => prev.map((c) => c._id === data._id ? data : c));
      toast.success(data.isActive ? "Activated" : "Deactivated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleResetUsage = async (code) => {
    try {
      const { data } = await api.patch(`/promo-codes/${code._id}/reset`);
      setCodes((prev) => prev.map((c) => c._id === code._id ? { ...c, usedCount: 0 } : c));
      toast.success("Usage reset to 0");
    } catch {
      toast.error("Failed to reset");
    }
  };

  const filtered = codes.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const activeCount   = codes.filter((c) => c.isActive && !isExpired(c) && !isExhausted(c)).length;
  const totalUses     = codes.reduce((s, c) => s + (c.usedCount || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="animate-fadeIn space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Promo Codes</h1>
          <p className="mt-1 text-sm text-slate-500">Create discount codes learners can apply at checkout.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Promo Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Codes"  value={codes.length}  color="border-slate-200 bg-white text-brand-ink" />
        <Stat label="Active"       value={activeCount}   color="border-green-200 bg-green-50 text-green-800" />
        <Stat label="Inactive"     value={codes.length - activeCount} color="border-slate-200 bg-slate-50 text-slate-600" />
        <Stat label="Total Uses"   value={totalUses}     color="border-brand-primary/20 bg-brand-primary/5 text-brand-primary" />
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search codes…"
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🏷️</div>
            <p className="font-semibold text-brand-ink">No promo codes yet</p>
            <p className="text-sm text-slate-500">Create your first code to offer discounts.</p>
            <button onClick={openCreate} className="mt-2 rounded-xl bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
              Create Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Applies To</th>
                  <th className="px-5 py-3.5">Uses</th>
                  <th className="px-5 py-3.5">Expires</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((code) => {
                  const expired   = isExpired(code);
                  const exhausted = isExhausted(code);
                  return (
                    <tr key={code._id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="font-mono text-base font-black text-brand-primary tracking-wider">{code.code}</p>
                        {code.description && (
                          <p className="mt-0.5 text-xs text-slate-400 truncate max-w-[200px]">{code.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
                          {code.discountType === "percentage"
                            ? `${code.discountValue}% off`
                            : `₹${code.discountValue} off`}
                        </span>
                        {code.minAmount > 0 && (
                          <p className="mt-0.5 text-xs text-slate-400">Min ₹{code.minAmount}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {code.applicableTo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-brand-ink">{code.usedCount}</span>
                        {code.maxUses > 0 && (
                          <span className="text-slate-400"> / {code.maxUses}</span>
                        )}
                        {code.maxUses === 0 && (
                          <span className="text-slate-400"> / ∞</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {code.expiresAt
                          ? <span className={expired ? "text-orange-600 font-semibold" : ""}>{new Date(code.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          : <span className="text-slate-400 italic">Never</span>}
                      </td>
                      <td className="px-5 py-4">
                        <Badge active={code.isActive} expired={expired} exhausted={exhausted} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggleActive(code)}
                            title={code.isActive ? "Deactivate" : "Activate"}
                            className={`rounded-lg p-2 transition ${code.isActive ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"}`}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {code.isActive
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              }
                            </svg>
                          </button>
                          {/* Reset usage */}
                          {code.usedCount > 0 && (
                            <button
                              onClick={() => handleResetUsage(code)}
                              title="Reset usage count"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-ink"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(code)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-primary"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleting(code)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={closeModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-panel"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h2 className="text-base font-bold text-brand-ink">
                {modal === "create" ? "🏷️ New Promo Code" : "✏️ Edit Promo Code"}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              {/* Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-ink">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="e.g. SAVE20"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-ink">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="e.g. 20% off for new learners"
                />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-ink">Discount Type <span className="text-red-500">*</span></label>
                  <select
                    value={form.discountType}
                    onChange={(e) => set("discountType", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-ink">
                    {form.discountType === "percentage" ? "Discount %" : "Discount ₹"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                    min="1"
                    max={form.discountType === "percentage" ? "100" : undefined}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
                    required
                  />
                </div>
              </div>

              {/* Max uses + Min amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-ink">Max Uses</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => set("maxUses", e.target.value)}
                    min="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="0 = unlimited"
                  />
                  <p className="mt-1 text-xs text-slate-400">0 = unlimited uses</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-ink">Min Amount (₹)</label>
                  <input
                    type="number"
                    value={form.minAmount}
                    onChange={(e) => set("minAmount", e.target.value)}
                    min="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="0 = no minimum"
                  />
                  <p className="mt-1 text-xs text-slate-400">Minimum cart value</p>
                </div>
              </div>

              {/* Applicable to + Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-ink">Applies To</label>
                  <select
                    value={form.applicableTo}
                    onChange={(e) => set("applicableTo", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="all">All (Courses + Tests)</option>
                    <option value="courses">Courses only</option>
                    <option value="tests">Tests only</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-ink">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => set("expiresAt", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <p className="mt-1 text-xs text-slate-400">Leave blank = never expires</p>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={() => set("isActive", !form.isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${form.isActive ? "bg-brand-primary" : "bg-slate-200"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${form.isActive ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{form.isActive ? "Active" : "Inactive"}</p>
                  <p className="text-xs text-slate-400">{form.isActive ? "Learners can use this code" : "Code is disabled"}</p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : modal === "create" ? "Create Code" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">🗑️</div>
            <h3 className="text-lg font-bold text-brand-ink">Delete {deleting.code}?</h3>
            <p className="mt-1 text-sm text-slate-500">This action cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setDeleting(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleting)}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
