import React, { useEffect, useMemo, useState } from 'react';
import { getRecordings, deleteRecording } from '../../api/recordings';
import toast from 'react-hot-toast';

/* ── helpers ── */
function fmt(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtSize(b) {
  if (!b) return '—';
  return b > 1073741824 ? `${(b / 1073741824).toFixed(1)} GB` : `${(b / 1048576).toFixed(0)} MB`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function embedUrl(rec) {
  if (!rec?.bunnyVideoId || !rec?.bunnyLibraryId) return null;
  return `https://iframe.mediadelivery.net/embed/${rec.bunnyLibraryId}/${rec.bunnyVideoId}?autoplay=false&responsive=true&preload=false`;
}

/* ── status config ── */
const STATUS = {
  uploading:  { label: 'Uploading',  dot: 'bg-blue-400',   pill: 'bg-blue-50 text-blue-700 ring-blue-200'     },
  processing: { label: 'Processing', dot: 'bg-amber-400',  pill: 'bg-amber-50 text-amber-700 ring-amber-200'  },
  ready:      { label: 'Ready',      dot: 'bg-emerald-400',pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  failed:     { label: 'Failed',     dot: 'bg-rose-400',   pill: 'bg-rose-50 text-rose-700 ring-rose-200'     },
};

/* ── icons ── */
const Ic = {
  Video: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>,
  Play: () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Disk: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  ChevDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="6 9 12 15 18 9" /></svg>,
};

/* ── Stat card ── */
function StatCard({ label, value, accent, icon }) {
  const colors = {
    blue:    { bg: 'bg-brand-surface', text: 'text-brand-accent', val: 'text-brand-primary' },
    emerald: { bg: 'bg-emerald-50',    text: 'text-emerald-500',  val: 'text-emerald-700'   },
    amber:   { bg: 'bg-amber-50',      text: 'text-amber-500',    val: 'text-amber-700'     },
    rose:    { bg: 'bg-rose-50',       text: 'text-rose-500',     val: 'text-rose-700'      },
  }[accent];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold ${colors.val}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── Preview modal ── */
function PreviewModal({ rec, onClose }) {
  const url = embedUrl(rec);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between rounded-t-2xl bg-brand-ink px-5 py-4">
          <div>
            <p className="font-semibold text-white truncate max-w-lg">{rec.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{rec.course?.title} {rec.batches?.length ? `· ${rec.batches.map(b => b.name).join(', ')}` : ''}</p>
          </div>
          <button onClick={onClose} className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <Ic.Close />
          </button>
        </div>
        {/* player */}
        <div className="aspect-video rounded-b-2xl overflow-hidden shadow-2xl">
          {url ? (
            <iframe src={url} className="h-full w-full" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen title={rec.title} />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-900 text-slate-500 text-sm">Video not available</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [preview, setPreview]       = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    setLoading(true);
    getRecordings()
      .then(setRecordings)
      .catch(() => toast.error('Could not load recordings'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const stats = useMemo(() => ({
    total:      recordings.length,
    ready:      recordings.filter(r => r.status === 'ready').length,
    processing: recordings.filter(r => r.status === 'processing' || r.status === 'uploading').length,
    failed:     recordings.filter(r => r.status === 'failed').length,
  }), [recordings]);

  const filtered = useMemo(() => recordings.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter || (statusFilter === 'processing' && r.status === 'uploading');
    const q = search.toLowerCase();
    const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.course?.title?.toLowerCase().includes(q) || r.instructor?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [recordings, statusFilter, search]);

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete "${rec.title}"? This cannot be undone.`)) return;
    setDeletingId(rec._id);
    try {
      await deleteRecording(rec._id);
      setRecordings(p => p.filter(r => r._id !== rec._id));
      toast.success('Recording deleted');
    } catch { toast.error('Could not delete recording'); }
    finally { setDeletingId(null); }
  };

  const STATUS_TABS = [
    { key: 'all',        label: 'All',        count: stats.total      },
    { key: 'ready',      label: 'Ready',      count: stats.ready      },
    { key: 'processing', label: 'Processing', count: stats.processing },
    { key: 'failed',     label: 'Failed',     count: stats.failed     },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-ink flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-surface text-brand-accent">
              <Ic.Video />
            </span>
            Recorded Sessions
          </h1>
          <p className="mt-1 text-sm text-slate-500 ml-11">All session recordings stored on Bunny Stream</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-card hover:bg-brand-surface hover:border-brand-accent hover:text-brand-accent transition-all">
          <Ic.Refresh /> Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total"      value={stats.total}      accent="blue"    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>} />
        <StatCard label="Ready"      value={stats.ready}      accent="emerald" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
        <StatCard label="Processing" value={stats.processing} accent="amber"   icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} />
        <StatCard label="Failed"     value={stats.failed}     accent="rose"    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>} />
      </div>

      {/* ── Toolbar: search + status tabs ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === tab.key ? 'bg-white text-brand-primary shadow-card' : 'text-slate-500 hover:text-brand-ink'}`}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusFilter === tab.key ? 'bg-brand-surface text-brand-accent' : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Ic.Search /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, course, instructor…"
            className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-brand-ink placeholder:text-slate-400 shadow-card focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 w-72" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Loading recordings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-12 w-12 opacity-30"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
            <p className="font-medium">{search || statusFilter !== 'all' ? 'No recordings match your filter' : 'No recordings yet'}</p>
            <p className="text-xs">Recordings appear here once a host ends a session</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Session Title', 'Course & Batch', 'Instructor', 'Duration', 'Size', 'Status', 'Recorded On', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(rec => {
                const s = STATUS[rec.status] || STATUS.failed;
                const isDeleting = deletingId === rec._id;
                return (
                  <tr key={rec._id} className="group hover:bg-brand-surface/30 transition-colors">
                    {/* title */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-semibold text-brand-ink truncate">{rec.title}</p>
                      {rec.liveClass?.title && <p className="mt-0.5 text-[11px] text-slate-400 truncate">{rec.liveClass.title}</p>}
                    </td>
                    {/* course & batch */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-brand-ink font-medium truncate max-w-[160px]">{rec.course?.title || '—'}</p>
                      {rec.batches?.length > 0 && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <Ic.Users />{rec.batches.map(b => b.name).join(', ')}
                        </p>
                      )}
                    </td>
                    {/* instructor */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-surface text-[11px] font-bold text-brand-primary">
                          {(rec.instructor?.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-700 truncate max-w-[100px]">{rec.instructor?.name || '—'}</span>
                      </div>
                    </td>
                    {/* duration */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><Ic.Clock />{fmt(rec.duration)}</span>
                    </td>
                    {/* size */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><Ic.Disk />{fmtSize(rec.size)}</span>
                    </td>
                    {/* status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${s.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${rec.status !== 'ready' && rec.status !== 'failed' ? 'animate-pulse' : ''}`} />
                        {s.label}
                      </span>
                    </td>
                    {/* date */}
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(rec.recordedAt)}</td>
                    {/* actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {rec.status === 'ready' && embedUrl(rec) && (
                          <button onClick={() => setPreview(rec)} title="Preview"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-accent hover:bg-brand-surface transition-colors">
                            <Ic.Play />
                          </button>
                        )}
                        <button onClick={() => handleDelete(rec)} disabled={isDeleting} title="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-40">
                          {isDeleting
                            ? <div className="h-3.5 w-3.5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                            : <Ic.Trash />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Preview modal ── */}
      {preview && <PreviewModal rec={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
