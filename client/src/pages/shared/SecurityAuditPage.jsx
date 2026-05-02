import { useState } from "react";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const SecurityAuditPage = () => {
  const [action, setAction] = useState("");
  const { data: logs, loading } = useFetch(
    () => api.get(action ? `/security/content-logs?action=${action}` : "/security/content-logs"),
    [action]
  );

  if (loading) return <Loader label="Loading security audit..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Content Protection</p>
          <h2 className="font-display text-3xl text-slate-900">Security Audit</h2>
          <p className="mt-2 text-sm text-slate-500">Review protected content views, blocked actions, and file access events.</p>
        </div>
        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={action} onChange={(event) => setAction(event.target.value)}>
          <option value="">All actions</option>
          <option value="view">Views</option>
          <option value="download">File opens</option>
          <option value="blocked-copy">Blocked copy</option>
          <option value="blocked-context-menu">Blocked right-click</option>
          <option value="blocked-shortcut">Blocked shortcuts</option>
        </select>
      </div>

      {!logs.length ? (
        <EmptyState title="No audit logs" description="Protected content activity will appear here." />
      ) : (
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t border-slate-100">
                    <td className="py-4 font-medium text-slate-900">{log.user?.name}</td>
                    <td className="py-4 text-slate-500">{log.user?.role}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{log.action}</span>
                    </td>
                    <td className="py-4 text-slate-500">{log.course?.title || "-"}</td>
                    <td className="py-4 text-slate-500">{log.resource || "-"}</td>
                    <td className="py-4 text-slate-500">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default SecurityAuditPage;
