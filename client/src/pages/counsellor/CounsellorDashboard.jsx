import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  new:          { label: "New",         cls: "bg-blue-100 text-blue-700"    },
  contacted:    { label: "Contacted",   cls: "bg-yellow-100 text-yellow-700" },
  assigned:     { label: "Assigned",    cls: "bg-purple-100 text-purple-700" },
  "in-progress":{ label: "In Progress", cls: "bg-orange-100 text-orange-700" },
  admitted:     { label: "Admitted",    cls: "bg-green-100 text-green-700"   },
  lost:         { label: "Lost",        cls: "bg-red-100 text-red-700"       },
};

export default function CounsellorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/leads?limit=5&sort=-createdAt")
      .then(({ data }) => setLeads(data.leads))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: leads.length,
    admitted: leads.filter((l) => l.status === "admitted").length,
    followUp: leads.filter((l) => l.followUpDate && new Date(l.followUpDate) < new Date() && l.status !== "admitted").length,
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Welcome, {user?.name} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Here's your lead summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "My Leads", value: stats.total, color: "text-brand-primary", to: "/counsellor/leads" },
          { label: "Admitted", value: stats.admitted, color: "text-green-600", to: "/counsellor/leads?status=admitted" },
          { label: "Overdue Follow-ups", value: stats.followUp, color: "text-red-600", to: "/counsellor/leads?followUpToday=true" },
        ].map((s) => (
          <button key={s.label} onClick={() => navigate(s.to)} className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-700">Recent Leads</h2>
          <button onClick={() => navigate("/counsellor/leads")} className="text-xs font-semibold text-brand-primary hover:underline">View all →</button>
        </div>
        {loading ? (
          <div className="flex justify-center h-24 items-center">
            <div className="h-6 w-6 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No leads assigned yet</p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
              const overdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && lead.status !== "admitted";
              return (
                <button
                  key={lead._id}
                  onClick={() => navigate(`/counsellor/leads`)}
                  className="w-full text-left flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold flex-shrink-0">
                    {lead.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-slate-400 truncate">{lead.phone} {lead.interestedIn ? `· ${lead.interestedIn}` : ""}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                    {overdue && <span className="text-xs text-red-500 font-medium">⚠️ Follow-up overdue</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
