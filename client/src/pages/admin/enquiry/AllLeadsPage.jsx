import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../api/client";
import LeadDetailModal from "./LeadDetailModal";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  new:           { label: "New",          dot: "bg-blue-500",   cls: "bg-blue-50 text-blue-700 ring-blue-200"    },
  contacted:     { label: "Contacted",    dot: "bg-yellow-500", cls: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
  assigned:      { label: "Assigned",     dot: "bg-purple-500", cls: "bg-purple-50 text-purple-700 ring-purple-200" },
  "in-progress": { label: "In Progress",  dot: "bg-orange-500", cls: "bg-orange-50 text-orange-700 ring-orange-200" },
  admitted:      { label: "Admitted",     dot: "bg-green-500",  cls: "bg-green-50 text-green-700 ring-green-200"   },
  lost:          { label: "Lost",         dot: "bg-red-500",    cls: "bg-red-50 text-red-700 ring-red-200"         },
};

const SOURCE_LABELS = {
  "web-form": "Web Form",
  social:     "Social",
  referral:   "Referral",
  "walk-in":  "Walk-in",
  call:       "Call",
  other:      "Other",
};

const SOURCE_COLORS = {
  "web-form": "bg-cyan-100 text-cyan-700",
  social:     "bg-pink-100 text-pink-700",
  referral:   "bg-violet-100 text-violet-700",
  "walk-in":  "bg-amber-100 text-amber-700",
  call:       "bg-teal-100 text-teal-700",
  other:      "bg-slate-100 text-slate-600",
};

const AVATAR_COLORS = [
  "bg-violet-500","bg-blue-500","bg-teal-500","bg-amber-500",
  "bg-rose-500","bg-indigo-500","bg-emerald-500","bg-pink-500",
];

function avatarColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-7 w-16 rounded-lg bg-slate-100 animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 leading-none">{value ?? "—"}</p>
        )}
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ─── FilterChip ─────────────────────────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </span>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function AllLeadsPage({ isCounsellor = false }) {
  const [params, setParams]         = useSearchParams();
  const [leads, setLeads]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats]           = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openLead, setOpenLead]     = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [bulkCounsellor, setBulkCounsellor] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [search, setSearch]         = useState(params.get("search") || "");
  const [sourceFilter, setSourceFilter] = useState(params.get("source") || "");
  const [assignedToFilter, setAssignedToFilter] = useState(params.get("assignedTo") || "");
  const [page, setPage]             = useState(1);
  const searchTimer = useRef(null);
  const LIMIT = 30;

  const status        = params.get("status") || "";
  const followUpToday = params.get("followUpToday") || "";

  /* Load leads */
  const load = useCallback(() => {
    setLoading(true);
    setSelectedIds([]);
    const q = new URLSearchParams({ page, limit: LIMIT });
    if (status)        q.set("status", status);
    if (search)        q.set("search", search);
    if (followUpToday) q.set("followUpToday", followUpToday);
    if (sourceFilter)  q.set("source", sourceFilter);
    if (assignedToFilter) q.set("assignedTo", assignedToFilter);
    api.get(`/leads?${q}`)
      .then(({ data }) => { setLeads(data.leads); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [status, search, page, followUpToday, sourceFilter, assignedToFilter]);

  useEffect(() => { load(); }, [load]);

  /* Load stats */
  useEffect(() => {
    if (!isCounsellor) {
      setStatsLoading(true);
      api.get("/leads/stats")
        .then(({ data }) => setStats({
          total:         data.total,
          newToday:      data.todayNew,
          followUpToday: data.overdueFollowUps,
          admitted:      data.byStatus?.admitted || 0,
        }))
        .finally(() => setStatsLoading(false));
    }
  }, [isCounsellor]);

  /* Derive stats for counsellor */
  const derivedStats = isCounsellor ? {
    total:        leads.length,
    newToday:     leads.filter((l) => {
      const d = new Date(l.createdAt);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    followUpToday: leads.filter((l) => {
      if (!l.followUpDate) return false;
      const d = new Date(l.followUpDate);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    admitted:     leads.filter((l) => l.status === "admitted").length,
  } : stats;

  /* Load counsellors */
  useEffect(() => {
    if (!isCounsellor) {
      api.get("/leads/counsellors").then(({ data }) => setCounsellors(data));
    }
  }, [isCounsellor]);

  /* Search debounce */
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  };

  /* Selection */
  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelectedIds(selectedIds.length === leads.length ? [] : leads.map((l) => l._id));

  /* Bulk assign */
  const bulkAssign = async () => {
    if (!bulkCounsellor || !selectedIds.length) return;
    setBulkLoading(true);
    try {
      await api.patch("/leads/bulk-assign", { leadIds: selectedIds, counsellorId: bulkCounsellor });
      load();
    } finally { setBulkLoading(false); setBulkCounsellor(""); }
  };

  /* Delete */
  const deleteLead = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    await api.delete(`/leads/${id}`);
    load();
  };

  /* Helpers */
  const pages = Math.ceil(total / LIMIT);

  const pageTitle = status
    ? (STATUS_CONFIG[status]?.label || status) + " Leads"
    : followUpToday ? "Follow-ups Today" : "All Leads";

  const anyFilter = !!(status || search || sourceFilter || assignedToFilter || followUpToday);

  const clearAllFilters = () => {
    setSearch("");
    setSourceFilter("");
    setAssignedToFilter("");
    setParams({});
    setPage(1);
  };

  /* Page numbers to show */
  const pageNumbers = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) pageNumbers.push(i);
  }
  const pagesWithGaps = [];
  pageNumbers.forEach((n, idx) => {
    if (idx > 0 && n - pageNumbers[idx - 1] > 1) pagesWithGaps.push("…");
    pagesWithGaps.push(n);
  });

  return (
    <div className="min-h-screen bg-slate-50/60 p-6 space-y-6">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${total.toLocaleString()} lead${total !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads"
          value={isCounsellor ? derivedStats?.total : derivedStats?.total}
          loading={isCounsellor ? loading : statsLoading}
          color="bg-brand-primary/10 text-brand-primary"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="New Today"
          value={derivedStats?.newToday}
          loading={isCounsellor ? loading : statsLoading}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
          }
        />
        <StatCard
          label="Follow-ups Today"
          value={derivedStats?.followUpToday}
          loading={isCounsellor ? loading : statsLoading}
          color="bg-amber-50 text-amber-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Admitted"
          value={derivedStats?.admitted}
          loading={isCounsellor ? loading : statsLoading}
          color="bg-green-50 text-green-600"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search name, phone, email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-colors"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setParams(e.target.value ? { status: e.target.value } : {}); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-slate-700 min-w-[140px]"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Source */}
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-slate-700 min-w-[140px]"
          >
            <option value="">All Sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Assigned To (admin only) */}
          {!isCounsellor && (
            <select
              value={assignedToFilter}
              onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-slate-700 min-w-[160px]"
            >
              <option value="">All Counsellors</option>
              {counsellors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}

          {/* Follow-ups Today toggle */}
          <button
            onClick={() => {
              setParams(followUpToday ? {} : { followUpToday: "true" });
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              followUpToday
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Follow-ups Today
          </button>

          {/* Clear filters */}
          {anyFilter && (
            <button
              onClick={clearAllFilters}
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {anyFilter && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-50">
            <span className="text-xs text-slate-400 font-medium">Active:</span>
            {status && (
              <FilterChip
                label={`Status: ${STATUS_CONFIG[status]?.label || status}`}
                onRemove={() => { setParams({}); setPage(1); }}
              />
            )}
            {search && (
              <FilterChip
                label={`Search: "${search}"`}
                onRemove={() => { setSearch(""); setPage(1); }}
              />
            )}
            {sourceFilter && (
              <FilterChip
                label={`Source: ${SOURCE_LABELS[sourceFilter] || sourceFilter}`}
                onRemove={() => { setSourceFilter(""); setPage(1); }}
              />
            )}
            {assignedToFilter && (
              <FilterChip
                label={`Assigned: ${counsellors.find((c) => c._id === assignedToFilter)?.name || "..."}`}
                onRemove={() => { setAssignedToFilter(""); setPage(1); }}
              />
            )}
            {followUpToday && (
              <FilterChip
                label="Follow-ups Today"
                onRemove={() => { setParams({}); setPage(1); }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Table card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="h-8 w-8 rounded-full border-[3px] border-brand-primary border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading leads…</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-8 w-8 text-slate-300">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500">No leads found</p>
            <p className="text-xs mt-1 text-slate-400">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {!isCounsellor && (
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === leads.length && leads.length > 0}
                        onChange={toggleAll}
                        className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary/30"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lead</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Course</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">City</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  {!isCounsellor && (
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Assigned To</th>
                  )}
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Follow-up</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.map((lead) => {
                  const isSelected       = selectedIds.includes(lead._id);
                  const statusCfg        = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
                  const srcColor         = SOURCE_COLORS[lead.source] || SOURCE_COLORS.other;
                  const srcLabel         = SOURCE_LABELS[lead.source] || lead.source;
                  const avatarBg         = avatarColor(lead.name);
                  const ini              = initials(lead.name);
                  const assignedIni      = lead.assignedTo ? initials(lead.assignedTo.name) : null;
                  const assignedBg       = lead.assignedTo ? avatarColor(lead.assignedTo.name) : "";
                  const followUpDt       = lead.followUpDate ? new Date(lead.followUpDate) : null;
                  const isOverdue        = followUpDt && followUpDt < new Date() && lead.status !== "admitted" && lead.status !== "lost";

                  return (
                    <tr
                      key={lead._id}
                      onClick={() => setOpenLead(lead._id)}
                      className={`group cursor-pointer transition-colors hover:bg-slate-50/80 ${
                        isSelected ? "bg-brand-primary/[0.04]" : ""
                      }`}
                    >
                      {!isCounsellor && (
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(lead._id)}
                            className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary/30"
                          />
                        </td>
                      )}

                      {/* Lead avatar + name + source badge */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarBg}`}>
                            {ini}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm leading-snug truncate max-w-[140px]">{lead.name}</p>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${srcColor}`}>{srcLabel}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <p className="text-slate-700 text-sm font-medium">{lead.phone}</p>
                        {lead.email && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{lead.email}</p>}
                      </td>

                      {/* Course */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-slate-600 text-sm truncate max-w-[160px]">{lead.interestedIn || <span className="text-slate-300">—</span>}</p>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <p className="text-slate-600 text-sm">{lead.city || <span className="text-slate-300">—</span>}</p>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${statusCfg.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Assigned To */}
                      {!isCounsellor && (
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${assignedBg}`}>
                                {assignedIni}
                              </div>
                              <span className="text-slate-700 text-xs font-medium truncate max-w-[100px]">{lead.assignedTo.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">Unassigned</span>
                          )}
                        </td>
                      )}

                      {/* Follow-up */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {followUpDt ? (
                          <div className={`flex items-center gap-1.5 ${isOverdue ? "text-red-600" : "text-slate-600"}`}>
                            {isOverdue && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 flex-shrink-0">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                            )}
                            <span className="text-xs font-medium">{followUpDt.toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-slate-400 text-xs">{relativeTime(lead.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {!isCounsellor && (
                          <button
                            onClick={() => deleteLead(lead._id)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete lead"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer / pagination */}
        {!loading && leads.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex-wrap gap-3">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(page - 1) * LIMIT + 1}</span>–<span className="font-semibold text-slate-700">{Math.min(page * LIMIT, total)}</span> of <span className="font-semibold text-slate-700">{total.toLocaleString()}</span>
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                >
                  ← Prev
                </button>
                {pagesWithGaps.map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                        page === p
                          ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bulk action floating bar ─────────────────────────────────────── */}
      {!isCounsellor && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 shadow-2xl shadow-slate-900/30 text-white">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <div className="h-6 w-6 rounded-full bg-brand-primary flex items-center justify-center text-xs font-bold text-white">
              {selectedIds.length}
            </div>
            <span className="text-sm font-semibold">{selectedIds.length} lead{selectedIds.length !== 1 ? "s" : ""} selected</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Assign to:</span>
          <select
            value={bulkCounsellor}
            onChange={(e) => setBulkCounsellor(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 text-white text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 min-w-[160px]"
          >
            <option value="">Select counsellor…</option>
            {counsellors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button
            onClick={bulkAssign}
            disabled={!bulkCounsellor || bulkLoading}
            className="px-4 py-1.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-40 transition-all"
          >
            {bulkLoading ? "Assigning…" : "Assign"}
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Clear selection"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Lead detail drawer ───────────────────────────────────────────── */}
      {openLead && (
        <LeadDetailModal
          leadId={openLead}
          onClose={() => setOpenLead(null)}
          onUpdated={load}
          isAdmin={!isCounsellor}
          counsellors={counsellors}
        />
      )}
    </div>
  );
}
