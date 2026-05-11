import React, { useEffect, useMemo, useState } from 'react';
import { getRecordings, deleteRecording } from '../../api/recordings';
import toast from 'react-hot-toast';

/* ── helpers ── */
const fmt = (s) => { if (!s) return '0m'; const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
const fmtSize = (b) => { if (!b) return '—'; return b > 1073741824 ? `${(b/1073741824).toFixed(1)} GB` : `${(b/1048576).toFixed(0)} MB`; };
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const buildUrl = (rec) => rec?.bunnyVideoId && rec?.bunnyLibraryId ? `https://iframe.mediadelivery.net/embed/${rec.bunnyLibraryId}/${rec.bunnyVideoId}?autoplay=false&responsive=true&preload=false` : null;

const STATUS = {
  uploading:  { label: 'Uploading',  dot: 'bg-blue-400 animate-pulse', pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'       },
  processing: { label: 'Processing', dot: 'bg-amber-400 animate-pulse',pill: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'    },
  ready:      { label: 'Ready',      dot: 'bg-emerald-400',             pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  failed:     { label: 'Failed',     dot: 'bg-rose-400',                pill: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'       },
};

/* ── icons (inline, no external dep) ── */
const IcVideo   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>;
const IcPlay    = () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IcTrash   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>;
const IcRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>;
const IcBook    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
const IcUsers   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
const IcClose   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IcChev    = ({ open }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>;

/* ── Preview modal ── */
function PreviewModal({ rec, onClose }) {
  const url = buildUrl(rec);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between rounded-t-2xl bg-brand-ink px-5 py-4">
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{rec.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">{rec.course?.title}{rec.batches?.length ? ` · ${rec.batches.map(b=>b.name).join(', ')}` : ''}</p>
          </div>
          <button onClick={onClose} className="ml-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"><IcClose /></button>
        </div>
        <div className="aspect-video rounded-b-2xl overflow-hidden shadow-2xl bg-slate-900">
          {url ? <iframe src={url} className="h-full w-full" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen title={rec.title} />
               : <div className="flex h-full items-center justify-center text-slate-500 text-sm">Video not available</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Course section ── */
function CourseSection({ courseName, thumbnail, batches, items, onDelete, deletingId, onPreview }) {
  const [open, setOpen] = useState(true);
  const batchLabel = batches?.map(b => b.name).join(' · ') || null;
  const readyCount = items.filter(r => r.status === 'ready').length;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card overflow-hidden">
      {/* ── Section header ── */}
      <button onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-brand-surface/30 transition-colors">
        {thumbnail
          ? <img src={thumbnail} alt={courseName} className="h-11 w-11 rounded-xl object-cover flex-shrink-0 border border-slate-200 shadow-card" />
          : <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-accent"><IcBook /></div>
        }
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-brand-ink truncate">{courseName}</p>
          {batchLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><IcUsers />{batchLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{readyCount} ready
          </span>
          <span className="text-xs text-slate-400">{items.length} total</span>
          <IcChev open={open} />
        </div>
      </button>

      {/* ── Table ── */}
      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60">
                {['Session', 'By', 'Duration', 'Size', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(rec => {
                const s = STATUS[rec.status] || STATUS.failed;
                const del = deletingId === rec._id;
                return (
                  <tr key={rec._id} className="group hover:bg-brand-surface/20 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-brand-ink truncate">{rec.title}</p>
                      {rec.liveClass?.title && <p className="text-[11px] text-slate-400 truncate mt-0.5">{rec.liveClass.title}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-surface text-[10px] font-bold text-brand-primary flex-shrink-0">
                          {(rec.instructor?.name||'?').slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-600 truncate max-w-[80px]">{rec.instructor?.name||'—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmt(rec.duration)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtSize(rec.size)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.pill}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">{fmtDate(rec.recordedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {rec.status === 'ready' && buildUrl(rec) && (
                          <button onClick={() => onPreview(rec)} title="Watch"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-accent hover:bg-brand-surface transition-colors">
                            <IcPlay />
                          </button>
                        )}
                        <button onClick={() => onDelete(rec)} disabled={del} title="Delete"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-40">
                          {del ? <div className="h-3 w-3 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" /> : <IcTrash />}
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
  );
}

/* ── Main page ── */
export default function InstructorRecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [preview, setPreview]       = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    getRecordings().then(setRecordings).catch(() => toast.error('Could not load recordings')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete "${rec.title}"?`)) return;
    setDeletingId(rec._id);
    try { await deleteRecording(rec._id); setRecordings(p => p.filter(r => r._id !== rec._id)); toast.success('Deleted'); }
    catch { toast.error('Could not delete'); } finally { setDeletingId(null); }
  };

  const stats = useMemo(() => ({
    total:   recordings.length,
    ready:   recordings.filter(r => r.status === 'ready').length,
    inprog:  recordings.filter(r => r.status === 'processing' || r.status === 'uploading').length,
    courses: new Set(recordings.map(r => r.course?._id).filter(Boolean)).size,
  }), [recordings]);

  const byCourse = useMemo(() => {
    const map = {};
    for (const r of recordings) {
      const key = r.course?._id || 'other';
      if (!map[key]) map[key] = { name: r.course?.title || 'Uncategorised', thumbnail: r.course?.thumbnail || null, batches: r.batches || [], items: [] };
      map[key].items.push(r);
    }
    return map;
  }, [recordings]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-brand-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-surface text-brand-accent"><IcVideo /></span>
            My Recordings
          </h1>
          <p className="mt-1 ml-11 text-sm text-slate-500">Session recordings from your live classes</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-card hover:bg-brand-surface hover:border-brand-accent hover:text-brand-accent transition-all">
          <IcRefresh /> Refresh
        </button>
      </div>

      {/* stat strip */}
      {!loading && stats.total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total',      val: stats.total,   clr: 'text-brand-primary', bg: 'bg-brand-surface'  },
            { label: 'Ready',      val: stats.ready,   clr: 'text-emerald-700',   bg: 'bg-emerald-50'     },
            { label: 'Processing', val: stats.inprog,  clr: 'text-amber-700',     bg: 'bg-amber-50'       },
            { label: 'Courses',    val: stats.courses, clr: 'text-violet-700',    bg: 'bg-violet-50'      },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-slate-200/70 ${s.bg} px-5 py-4 shadow-card`}>
              <p className={`text-2xl font-bold ${s.clr}`}>{s.val}</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading your recordings…</p>
        </div>
      )}

      {/* empty */}
      {!loading && stats.total === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white py-24 gap-3 shadow-card text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-14 w-14 opacity-25"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
          <p className="font-semibold text-slate-500">No recordings yet</p>
          <p className="text-xs text-center max-w-xs">Your session recordings will appear here, organised by course and batch</p>
        </div>
      )}

      {/* course sections */}
      {!loading && Object.entries(byCourse).map(([key, group]) => (
        <CourseSection key={key} courseName={group.name} thumbnail={group.thumbnail} batches={group.batches}
          items={group.items} onDelete={handleDelete} deletingId={deletingId} onPreview={setPreview} />
      ))}

      {preview && <PreviewModal rec={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
