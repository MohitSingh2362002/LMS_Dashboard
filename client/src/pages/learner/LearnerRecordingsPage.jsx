import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Video, Clock, BookOpen, Play, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getRecordings, getRecordingById } from '../../api/recordings';
import toast from 'react-hot-toast';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ── Bunny iframe player ── */
function BunnyPlayer({ embedUrl }) {
  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-gray-500 text-sm">
        Video not available yet
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Recorded session"
      />
    </div>
  );
}

/* ── Single recording card ── */
function RecordingCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleExpand = async () => {
    if (!expanded && !embedUrl) {
      setLoading(true);
      try {
        const data = await getRecordingById(rec._id);
        setEmbedUrl(data.embedUrl);
      } catch {
        toast.error('Could not load player');
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail + info row */}
      <div className="flex gap-4 p-4">
        <div
          className="relative w-40 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 cursor-pointer group"
          onClick={handleExpand}
        >
          {rec.thumbnailUrl ? (
            <img src={rec.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video size={28} className="text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={28} className="text-white" fill="white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm leading-snug">
            {rec.title}
          </h3>

          {rec.liveClass && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live class: {rec.liveClass.title}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDuration(rec.duration)}
            </span>
            {rec.course && (
              <span className="flex items-center gap-1">
                <BookOpen size={12} />
                {rec.course.title}
              </span>
            )}
            <span>{formatDate(rec.recordedAt)}</span>
          </div>

          {rec.status !== 'ready' && (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
              <Loader2 size={10} className="animate-spin" />
              {rec.status === 'uploading' ? 'Uploading…' : 'Processing…'}
            </span>
          )}
        </div>

        <button
          onClick={handleExpand}
          className="self-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Player panel */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          {loading ? (
            <div className="w-full aspect-video flex items-center justify-center">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
            </div>
          ) : (
            <BunnyPlayer embedUrl={embedUrl} />
          )}
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

  useEffect(() => {
    setLoading(true);
    getRecordings({ ...(courseId ? { courseId } : {}), status: 'ready' })
      .then(setRecordings)
      .catch(() => setError('Could not load recordings'))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Video size={24} className="text-indigo-500" />
          Recorded Sessions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Watch recordings of past live classes for your enrolled courses
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-16 text-red-500">{error}</div>
      )}

      {!loading && !error && recordings.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Video size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recordings available yet</p>
          <p className="text-sm mt-1">Recorded live sessions will appear here</p>
        </div>
      )}

      {!loading && !error && recordings.length > 0 && (
        <div className="space-y-4">
          {recordings.map((rec) => (
            <RecordingCard key={rec._id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
