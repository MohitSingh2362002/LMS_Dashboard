import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRecordings } from '../../api/recordings';
import toast from 'react-hot-toast';
import ProtectedVideoPlayer from '../../components/ProtectedVideoPlayer';

/* ── helpers ── */
const fmt = (s) => { if (!s) return '0m'; const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const buildUrl = (rec) => rec?.bunnyVideoId && rec?.bunnyLibraryId
  ? `https://iframe.mediadelivery.net/embed/${rec.bunnyLibraryId}/${rec.bunnyVideoId}?autoplay=false&responsive=true&preload=false`
  : null;

/* ── icons ── */
const IcPlay   = () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IcClose  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IcClock  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IcBook   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
const IcUsers  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
const IcVideo  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>;
const IcChev   = ({ open }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>;

/* ── Protected video player modal ── */
function PlayerModal({ rec, onClose }) {
  const url = buildUrl(rec);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/70 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between rounded-t-2xl bg-brand-ink px-5 py-4">
          <div className="min-w-0">
            <p className="font-semibold text-white leading-snug truncate">{rec.title}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {rec.course?.title} · {fmt(rec.duration)} · {fmtDate(rec.recordedAt)}
            </p>
          </div>
          <button onClick={onClose} className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <IcClose />
          </button>
        </div>
        {/* Protected player — watermark + logging + blocking */}
        <ProtectedVideoPlayer
          embedUrl={url}
          title={rec.title}
          courseId={rec.course?._id}
          videoId={rec._id}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

/* ── Recording card (horizontal) ── */
function RecordingCard({ rec, onPlay }) {
  const url = buildUrl(rec);
  const canPlay = rec.status === 'ready' && !!url;

  return (
    <div className="group flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card hover:shadow-cardHover transition-shadow">
      {/* Thumbnail */}
      <div
        onClick={() => canPlay && onPlay(rec)}
        className={`relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 ${canPlay ? 'cursor-pointer' : ''}`}
      >
        {rec.thumbnailUrl
          ? <img src={rec.thumbnailUrl} alt={rec.title} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-slate-300"><IcVideo /></div>
        }
        {/* Play overlay */}
        {canPlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-ink/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg text-brand-accent">
              <IcPlay />
            </div>
          </div>
        )}
        {/* Duration badge */}
        {rec.duration > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-brand-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {fmt(rec.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <h4 className="font-semibold text-brand-ink leading-snug line-clamp-2 text-sm">{rec.title}</h4>
          {rec.liveClass?.title && (
            <p className="mt-0.5 text-[11px] text-slate-400 truncate">Live class: {rec.liveClass.title}</p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><IcClock />{fmt(rec.duration)}</span>
          {rec.batches?.length > 0 && <span className="flex items-center gap-1"><IcUsers />{rec.batches.map(b=>b.name).join(', ')}</span>}
          <span className="text-slate-400">{fmtDate(rec.recordedAt)}</span>
        </div>
      </div>

      {/* Watch button */}
      {canPlay && (
        <div className="flex-shrink-0 self-center">
          <button onClick={() => onPlay(rec)}
            className="hidden sm:flex items-center gap-2 rounded-xl bg-brand-accent px-3 py-2 text-xs font-semibold text-white shadow-card hover:bg-brand-primary transition-colors opacity-0 group-hover:opacity-100">
            <IcPlay /> Watch
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Course section with collapsible recordings list ── */
function CourseSection({ courseName, thumbnail, batches, items, onPlay }) {
  const [open, setOpen] = useState(true);
  const batchLabel = batches?.map(b => b.name).join(' · ') || null;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card overflow-hidden">
      {/* Course header — acts as toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-brand-surface/30 transition-colors"
      >
        {/* thumbnail or icon */}
        {thumbnail
          ? <img src={thumbnail} alt={courseName} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover border border-slate-200 shadow-card" />
          : <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-accent"><IcBook /></div>
        }
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-ink">{courseName}</p>
          {batchLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><IcUsers />{batchLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* pill */}
          <span className="hidden sm:block rounded-full bg-brand-surface px-2.5 py-1 text-xs font-semibold text-brand-accent">
            {items.length} recording{items.length !== 1 ? 's' : ''}
          </span>
          <IcChev open={open} />
        </div>
      </button>

      {/* recordings list */}
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {items.map(rec => (
            <div key={rec._id} className="px-5 py-3">
              <RecordingCard rec={rec} onPlay={onPlay} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function LearnerRecordingsPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [playing, setPlaying]       = useState(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    setLoading(true);
    getRecordings({ ...(courseId ? { courseId } : {}), status: 'ready' })
      .then(setRecordings)
      .catch(() => setError('Could not load recordings'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const byCourse = useMemo(() => {
    const filtered = search
      ? recordings.filter(r => r.title?.toLowerCase().includes(search.toLowerCase()) || r.course?.title?.toLowerCase().includes(search.toLowerCase()))
      : recordings;
    const map = {};
    for (const r of filtered) {
      const key = r.course?._id || 'other';
      if (!map[key]) map[key] = { name: r.course?.title || 'Other', thumbnail: r.course?.thumbnail || null, batches: r.batches || [], items: [] };
      map[key].items.push(r);
    }
    return map;
  }, [recordings, search]);

  const totalReady = recordings.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent px-6 py-8 text-white shadow-panel">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-2 top-10 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <IcVideo />
          </div>
          <div>
            <h1 className="text-xl font-bold">Recorded Sessions</h1>
            <p className="mt-0.5 text-sm text-white/70">Watch past live classes from your enrolled courses</p>
          </div>
          {totalReady > 0 && (
            <div className="ml-auto hidden sm:block text-right">
              <p className="text-3xl font-bold">{totalReady}</p>
              <p className="text-xs text-white/60">Recording{totalReady !== 1 ? 's' : ''} available</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      {!loading && totalReady > 0 && (
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions or courses…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 shadow-card focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading your recordings…</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && totalReady === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white py-24 gap-3 shadow-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent opacity-50">
            <IcVideo />
          </div>
          <p className="font-semibold text-slate-600">No recordings yet</p>
          <p className="text-sm text-slate-400 text-center max-w-xs">Recorded live sessions will appear here once they finish processing</p>
        </div>
      )}

      {/* ── No search results ── */}
      {!loading && !error && totalReady > 0 && Object.keys(byCourse).length === 0 && search && (
        <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-8 text-center shadow-card">
          <p className="font-medium text-slate-500">No recordings match "<span className="text-brand-ink">{search}</span>"</p>
        </div>
      )}

      {/* ── Course sections ── */}
      {!loading && !error && Object.entries(byCourse).map(([key, group]) => (
        <CourseSection key={key} courseName={group.name} thumbnail={group.thumbnail}
          batches={group.batches} items={group.items} onPlay={setPlaying} />
      ))}

      {/* ── Player modal ── */}
      {playing && <PlayerModal rec={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
