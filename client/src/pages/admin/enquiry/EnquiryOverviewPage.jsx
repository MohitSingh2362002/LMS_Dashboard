import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/client";

const STATUS_CONFIG = {
  new:         { label: "New",         color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"   },
  contacted:   { label: "Contacted",   color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  assigned:    { label: "Assigned",    color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  "in-progress":{ label: "In Progress", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  admitted:    { label: "Admitted",    color: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  lost:        { label: "Lost",        color: "bg-red-100 text-red-700",      dot: "bg-red-500"    },
};

const StatCard = ({ label, value, sub, color = "text-brand-primary", onClick }) => (
  <button onClick={onClick} className="text-left w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value ?? "—"}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </button>
);

export default function EnquiryOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/leads/stats").then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );

  const s = stats?.byStatus || {};
  const conversionRate = stats?.total ? Math.round((s.admitted || 0) / stats.total * 100) : 0;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Enquiry Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Lead pipeline summary and counsellor performance</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Leads" value={stats?.total} onClick={() => navigate("/admin/enquiry/leads")} />
        <StatCard label="New Today" value={stats?.todayNew} color="text-blue-600" onClick={() => navigate("/admin/enquiry/leads?status=new")} />
        <StatCard label="Overdue Follow-ups" value={stats?.overdueFollowUps} color="text-red-600" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} color="text-green-600" sub={`${s.admitted || 0} admitted of ${stats?.total}`} />
      </div>

      {/* Pipeline funnel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-700 mb-5">Pipeline Breakdown</h2>
        <div className="space-y-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = s[key] || 0;
            const pct = stats?.total ? Math.round(count / stats.total * 100) : 0;
            return (
              <button
                key={key}
                onClick={() => navigate(`/admin/enquiry/leads?status=${key}`)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${cfg.dot}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Counsellor leaderboard */}
      {stats?.counsellorStats?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-slate-700 mb-5">Counsellor Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Counsellor</th>
                  <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
                  <th className="text-right py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admitted</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Conv %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.counsellorStats.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-800">{c.name}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{c.total}</td>
                    <td className="py-3 pr-4 text-right text-green-600 font-semibold">{c.admitted}</td>
                    <td className="py-3 text-right text-slate-600">
                      {c.total ? Math.round(c.admitted / c.total * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
