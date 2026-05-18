import { useEffect, useRef, useState } from "react";
import api from "../../../api/client";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  new:           { label: "New",          dot: "bg-blue-500",   cls: "bg-blue-50 text-blue-700 ring-blue-200",    pipelineCls: "bg-blue-500 text-white"  },
  contacted:     { label: "Contacted",    dot: "bg-yellow-500", cls: "bg-yellow-50 text-yellow-700 ring-yellow-200", pipelineCls: "bg-yellow-500 text-white" },
  assigned:      { label: "Assigned",     dot: "bg-purple-500", cls: "bg-purple-50 text-purple-700 ring-purple-200", pipelineCls: "bg-purple-500 text-white" },
  "in-progress": { label: "In Progress",  dot: "bg-orange-500", cls: "bg-orange-50 text-orange-700 ring-orange-200", pipelineCls: "bg-orange-500 text-white" },
  admitted:      { label: "Admitted",     dot: "bg-green-500",  cls: "bg-green-50 text-green-700 ring-green-200",  pipelineCls: "bg-green-500 text-white"  },
  lost:          { label: "Lost",         dot: "bg-red-500",    cls: "bg-red-50 text-red-700 ring-red-200",        pipelineCls: "bg-red-500 text-white"    },
};

const PIPELINE_STEPS = ["new", "contacted", "assigned", "in-progress", "admitted"];

const ACTION_CONFIG = {
  created:        { label: "Enquiry submitted", iconBg: "bg-slate-100",   iconColor: "text-slate-500" },
  assigned:       { label: "Lead assigned",     iconBg: "bg-purple-100",  iconColor: "text-purple-600" },
  status_changed: { label: "Status changed",    iconBg: "bg-blue-100",    iconColor: "text-blue-600"  },
  note_added:     { label: "Note added",        iconBg: "bg-amber-100",   iconColor: "text-amber-600" },
  details_updated:{ label: "Details updated",   iconBg: "bg-teal-100",    iconColor: "text-teal-600"  },
  followup_set:   { label: "Follow-up set",     iconBg: "bg-cyan-100",    iconColor: "text-cyan-600"  },
  admitted:       { label: "Marked admitted",   iconBg: "bg-green-100",   iconColor: "text-green-600" },
};

const SOURCE_LABELS = {
  "web-form": "Web Form", social: "Social", referral: "Referral",
  "walk-in": "Walk-in", call: "Call", other: "Other",
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
  if (!dateStr) return "";
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

/* ─── Small reusable components ─────────────────────────────────────────── */
const FormField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = "text", disabled }) => (
  <input
    type={type}
    value={value || ""}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-slate-50 disabled:text-slate-400 transition-shadow"
  />
);

const SelectInput = ({ value, onChange, options, disabled }) => (
  <select
    value={value || ""}
    onChange={onChange}
    disabled={disabled}
    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-slate-50 transition-shadow"
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

/* ─── Activity icon ─────────────────────────────────────────────────────── */
function ActivityIcon({ action }) {
  const cfg = ACTION_CONFIG[action] || { iconBg: "bg-slate-100", iconColor: "text-slate-500" };
  let icon;
  if (action === "admitted") {
    icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><path d="M20 6L9 17l-5-5" /></svg>;
  } else if (action === "assigned") {
    icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  } else if (action === "note_added") {
    icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
  } else if (action === "status_changed") {
    icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
  } else if (action === "followup_set") {
    icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  } else {
    icon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
  }
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconBg} ${cfg.iconColor}`}>
      {icon}
    </div>
  );
}

/* ─── Info chip ─────────────────────────────────────────────────────────── */
function InfoChip({ icon, label }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
      {icon}
      {label}
    </span>
  );
}

/* ─── Overview info card ────────────────────────────────────────────────── */
function InfoCard({ label, value, icon }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-700 truncate">{value || <span className="text-slate-300 font-normal">Not set</span>}</p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function LeadDetailModal({ leadId, onClose, onUpdated, isAdmin = true, counsellors = [] }) {
  const [lead, setLead]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState("overview");
  const [note, setNote]         = useState("");
  const [details, setDetails]   = useState({});
  const [followUpDate, setFollowUpDate] = useState("");
  const [assignTo, setAssignTo]         = useState("");
  const [assignNote, setAssignNote]     = useState("");
  const [mounted, setMounted]       = useState(false);
  const [learnerInfo, setLearnerInfo] = useState(null);
  const noteRef = useRef(null);

  /* Slide-in animation */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 280);
  };

  const load = () => {
    setLoading(true);
    api.get(`/leads/${leadId}`)
      .then(({ data }) => {
        setLead(data);
        setDetails(data.details || {});
        setFollowUpDate(data.followUpDate ? data.followUpDate.slice(0, 10) : "");
        setAssignTo(data.assignedTo?._id || "");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [leadId]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/leads/${leadId}`, { details, followUpDate: followUpDate || null });
      setLead(data);
      onUpdated?.();
    } finally { setSaving(false); }
  };

  const changeStatus = async (status) => {
    if (lead.status === status) return;
    const { data } = await api.put(`/leads/${leadId}`, { status });
    setLead(data);
    onUpdated?.();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await api.post(`/leads/${leadId}/activities`, { note, action: "note_added" });
    setNote("");
    load();
  };

  const doAssign = async () => {
    if (!assignTo) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/leads/${leadId}/assign`, { counsellorId: assignTo, note: assignNote });
      setLead(data);
      setAssignNote("");
      onUpdated?.();
    } finally { setSaving(false); }
  };

  const admit = async () => {
    if (!window.confirm("Mark this lead as Admitted? A Learner account will be created automatically if email exists.")) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/leads/${leadId}/admit`);
      setLead(data);
      if (data.learnerAccount) setLearnerInfo(data.learnerAccount);
      onUpdated?.();
    } finally { setSaving(false); }
  };

  const markLost = async () => {
    if (!window.confirm("Mark this lead as Lost?")) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/leads/${leadId}`, { status: "lost" });
      setLead(data);
      onUpdated?.();
    } finally { setSaving(false); }
  };

  const tabs = [
    { key: "overview",  label: "Overview" },
    { key: "details",   label: "Details"  },
    { key: "activity",  label: "Activity", badge: lead?.activities?.length },
    ...(isAdmin ? [{ key: "assign", label: "Assign" }] : []),
  ];

  const statusCfg  = lead ? (STATUS_CONFIG[lead.status] || STATUS_CONFIG.new) : STATUS_CONFIG.new;
  const avatarBg   = lead ? avatarColor(lead.name) : "bg-slate-400";
  const ini        = lead ? initials(lead.name) : "";
  const shortId    = lead ? String(lead._id).slice(-6).toUpperCase() : "";
  const isTerminal = lead?.status === "admitted" || lead?.status === "lost";

  /* Current pipeline step index */
  const currentStep = PIPELINE_STEPS.indexOf(lead?.status);

  return (
    <>
      {/* Dark overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-2xl bg-white shadow-2xl transition-transform duration-[280ms] ease-out ${mounted ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Loading state ────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-9 w-9 rounded-full border-[3px] border-brand-primary border-t-transparent animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Loading lead…</p>
            </div>
          </div>
        )}

        {!loading && lead && (
          <>
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 pt-6 pb-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4 min-w-0">
                  {/* Avatar */}
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm ${avatarBg}`}>
                    {ini}
                  </div>
                  {/* Name + meta */}
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900 leading-tight">{lead.name}</h2>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${statusCfg.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    </div>
                    {/* Contact chips */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <InfoChip
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 2.18h3a2 2 0 012 1.72c.13 1.06.37 2.1.72 3.11a2 2 0 01-.45 2.11L6.09 10.1A16 16 0 0013.9 17.9l1.22-1.22a2 2 0 012.11-.45c1.01.35 2.05.59 3.11.72A2 2 0 0122 18.92z" /></svg>}
                        label={lead.phone}
                      />
                      {lead.email && (
                        <InfoChip
                          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
                          label={lead.email}
                        />
                      )}
                      {lead.city && (
                        <InfoChip
                          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                          label={lead.city}
                        />
                      )}
                      {lead.source && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary/10 text-brand-primary uppercase tracking-wide">
                          {SOURCE_LABELS[lead.source] || lead.source}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-slate-400">ID: <span className="font-mono font-bold text-slate-500">{shortId}</span></span>
                      <span className="text-slate-200">·</span>
                      <span className="text-[11px] text-slate-400">Created {relativeTime(lead.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* ── Pipeline progress bar ─────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 py-4 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-0">
                {PIPELINE_STEPS.map((step, idx) => {
                  const cfg = STATUS_CONFIG[step];
                  const isActive  = lead.status === step;
                  const isPast    = currentStep > idx;
                  const isLast    = idx === PIPELINE_STEPS.length - 1;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <button
                        onClick={() => changeStatus(step)}
                        disabled={isTerminal || isActive}
                        title={cfg.label}
                        className={`
                          flex-1 py-1.5 px-1 text-center text-[11px] font-bold transition-all
                          ${isActive ? cfg.pipelineCls + " shadow-sm" : ""}
                          ${isPast  ? "bg-slate-200 text-slate-500" : ""}
                          ${!isActive && !isPast ? "bg-white text-slate-400 hover:bg-slate-100 border border-slate-200" : ""}
                          ${idx === 0 ? "rounded-l-full" : ""}
                          ${isLast   ? "rounded-r-full" : ""}
                          disabled:cursor-not-allowed
                        `}
                      >
                        {cfg.label}
                      </button>
                      {!isLast && (
                        <div className={`h-4 w-0 border-l-[6px] border-y-[10px] border-y-transparent flex-shrink-0 ${
                          isPast ? "border-l-slate-200" : isActive ? "" : "border-l-slate-200"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {lead.status === "lost" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-semibold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  This lead is marked as Lost
                </div>
              )}
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex border-b border-slate-100 px-6 bg-white">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                    tab === t.key
                      ? "border-brand-primary text-brand-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
                  }`}
                >
                  {t.label}
                  {t.badge > 0 && (
                    <span className={`inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full text-[10px] font-bold ${
                      tab === t.key ? "bg-brand-primary text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Scrollable content ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* ══ OVERVIEW TAB ══════════════════════════════════════════ */}
              {tab === "overview" && (
                <div className="p-6 space-y-6">
                  {/* Key info grid */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Key Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoCard
                        label="Assigned To"
                        value={lead.assignedTo?.name || "Unassigned"}
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                      />
                      <InfoCard
                        label="Follow-up Date"
                        value={lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null}
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                      />
                      <InfoCard
                        label="Interested In"
                        value={lead.interestedIn}
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>}
                      />
                      <InfoCard
                        label="City"
                        value={lead.city}
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                      />
                      <InfoCard
                        label="Source"
                        value={SOURCE_LABELS[lead.source] || lead.source}
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>}
                      />
                      <InfoCard
                        label="Created"
                        value={new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                      />
                    </div>
                  </div>

                  {/* Form submission data */}
                  {lead.rawFields && Object.keys(lead.rawFields).filter((k) => k !== "source").length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Form Submission Data</p>
                      <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                          {Object.entries(lead.rawFields)
                            .filter(([k]) => k !== "source")
                            .map(([k, v]) => (
                              <div key={k} className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide font-mono">{k}</span>
                                <span className="text-sm text-slate-700 font-medium truncate">{String(v)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {lead.message && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Message from Lead</p>
                      <p className="text-sm text-slate-700 italic leading-relaxed">"{lead.message}"</p>
                    </div>
                  )}

                  {/* Quick note */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Note</p>
                    <div className="flex gap-2">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a quick note…"
                        rows={2}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-shadow"
                      />
                      <button
                        onClick={addNote}
                        disabled={!note.trim()}
                        className="px-4 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-40 transition-all self-stretch"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ DETAILS TAB ══════════════════════════════════════════ */}
              {tab === "details" && (
                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Details</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField label="Profession">
                        <TextInput value={details.profession} onChange={(e) => setDetails({ ...details, profession: e.target.value })} placeholder="e.g. Software Engineer" />
                      </FormField>
                      <FormField label="Education">
                        <TextInput value={details.education} onChange={(e) => setDetails({ ...details, education: e.target.value })} placeholder="e.g. B.Tech" />
                      </FormField>
                      <FormField label="Qualification">
                        <TextInput value={details.qualification} onChange={(e) => setDetails({ ...details, qualification: e.target.value })} placeholder="e.g. Graduate" />
                      </FormField>
                      <FormField label="Experience">
                        <TextInput value={details.experience} onChange={(e) => setDetails({ ...details, experience: e.target.value })} placeholder="e.g. 2 years" />
                      </FormField>
                      <FormField label="Gender">
                        <SelectInput
                          value={details.gender}
                          onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                          options={[
                            { value: "", label: "Select gender" },
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" },
                            { value: "other", label: "Other" },
                          ]}
                        />
                      </FormField>
                      <FormField label="Date of Birth">
                        <TextInput type="date" value={details.dob ? details.dob.slice(0, 10) : ""} onChange={(e) => setDetails({ ...details, dob: e.target.value })} />
                      </FormField>
                      <FormField label="Alternate Phone">
                        <TextInput value={details.alternatePhone} onChange={(e) => setDetails({ ...details, alternatePhone: e.target.value })} placeholder="Alternate number" />
                      </FormField>
                      <FormField label="Follow-up Date">
                        <TextInput type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                      </FormField>
                      <div className="sm:col-span-2">
                        <FormField label="Address">
                          <TextInput value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} placeholder="Full address" />
                        </FormField>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {saving ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                          Save Details
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ══ ACTIVITY TAB ═════════════════════════════════════════ */}
              {tab === "activity" && (
                <div className="p-6 space-y-6">
                  {/* Add note area */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Add Note / Log</p>
                    <textarea
                      ref={noteRef}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write a call log, follow-up note, or update…"
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-shadow"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={addNote}
                        disabled={!note.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-40 transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        Post Note
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Activity Timeline</p>
                    {(!lead.activities || lead.activities.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-10 w-10 mb-2 text-slate-200">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        <p className="text-sm font-medium">No activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-0">
                        {[...(lead.activities || [])].reverse().map((act, i, arr) => {
                          const actionCfg = ACTION_CONFIG[act.action] || ACTION_CONFIG.created;
                          return (
                            <div key={i} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <ActivityIcon action={act.action} />
                                {i < arr.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1.5" />}
                              </div>
                              <div className={`pb-5 flex-1 min-w-0 ${i === arr.length - 1 ? "pb-2" : ""}`}>
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div>
                                    <span className="text-sm font-bold text-slate-700">{actionCfg.label}</span>
                                    <span className="text-xs text-slate-400 ml-2">by {act.performedByName || "System"}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">{relativeTime(act.createdAt)}</span>
                                </div>
                                {act.meta?.from && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_CONFIG[act.meta.from]?.cls || "bg-slate-100 text-slate-500"}`}>
                                      {STATUS_CONFIG[act.meta.from]?.label}
                                    </span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 text-slate-400"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_CONFIG[act.meta.to]?.cls || "bg-slate-100 text-slate-500"}`}>
                                      {STATUS_CONFIG[act.meta.to]?.label}
                                    </span>
                                  </div>
                                )}
                                {act.note && (
                                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                    {act.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ ASSIGN TAB (admin only) ═══════════════════════════════ */}
              {tab === "assign" && isAdmin && (
                <div className="p-6 space-y-5">
                  {/* Current assignment info */}
                  {lead.assignedTo ? (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(lead.assignedTo.name)}`}>
                        {initials(lead.assignedTo.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{lead.assignedTo.name}</p>
                        <p className="text-xs text-slate-400">
                          Currently assigned
                          {lead.assignedAt && ` · since ${new Date(lead.assignedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span className="ml-auto px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">Active</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-amber-500 flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      <p className="text-sm font-semibold text-amber-700">This lead is currently unassigned</p>
                    </div>
                  )}

                  {/* Counsellor selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assign to Counsellor</label>
                    <div className="grid gap-2">
                      {counsellors.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => setAssignTo(c._id)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                            assignTo === c._id
                              ? "border-brand-primary bg-brand-primary/5"
                              : "border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white"
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(c.name)}`}>
                            {initials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400 truncate">{c.email}</p>
                          </div>
                          {assignTo === c._id && (
                            <div className="ml-auto h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3"><path d="M20 6L9 17l-5-5" /></svg>
                            </div>
                          )}
                        </button>
                      ))}
                      {counsellors.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No counsellors available</p>
                      )}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignment Note <span className="font-normal text-slate-300">(optional)</span></label>
                    <textarea
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                      rows={3}
                      placeholder="E.g. Please follow up within 24 hours…"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-shadow"
                    />
                  </div>

                  <button
                    onClick={doAssign}
                    disabled={!assignTo || saving}
                    className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 disabled:opacity-40 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Assigning…
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                        Assign Lead
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50 space-y-3">

              {/* Learner account created banner */}
              {learnerInfo && !learnerInfo.alreadyExisted && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-blue-800">🎓 Learner Account Created</p>
                    <button onClick={() => setLearnerInfo(null)} className="text-blue-400 hover:text-blue-600 text-xs">Dismiss</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 border border-blue-100">
                      <p className="text-blue-400 font-semibold uppercase tracking-wider text-[10px]">Student ID</p>
                      <p className="text-blue-800 font-bold mt-0.5">{learnerInfo.studentId}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-blue-100">
                      <p className="text-blue-400 font-semibold uppercase tracking-wider text-[10px]">Temp Password</p>
                      <p className="text-blue-800 font-bold mt-0.5 font-mono">{learnerInfo.tempPassword}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-500">Share these credentials with the student. They can change the password after logging in.</p>
                </div>
              )}
              {learnerInfo?.alreadyExisted && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
                  ℹ️ A learner account already exists for <b>{learnerInfo.email}</b>
                </div>
              )}

              {lead.status === "admitted" ? (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="h-7 w-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-4 w-4"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800">Admitted</p>
                    {lead.admittedAt && <p className="text-xs text-green-600">on {new Date(lead.admittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
                  </div>
                </div>
              ) : lead.status === "lost" ? (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="h-7 w-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </div>
                  <p className="text-sm font-bold text-red-700">Marked as Lost</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={admit}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M20 6L9 17l-5-5" /></svg>
                    Mark Admitted
                  </button>
                  <button
                    onClick={markLost}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 hover:border-red-400 disabled:opacity-50 transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    Mark as Lost
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
