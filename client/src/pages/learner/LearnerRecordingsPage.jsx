import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Video, Clock, BookOpen, Play, ChevronDown, ChevronUp,
  Loader2, Users,
} from 'lucide-react';
import { getRecordings } from '../../api/recordings';
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
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Build Bunny embed URL directly from stored fields — no extra API call needed. */
function buildEmbedUrl(rec) {
  if (!rec.bunnyVideoId || !rec.bunnyLibraryId) return null;
  return `https://iframe.mediadelivery.net/embed/${rec.bunnyLibraryId}/${rec.bunnyVideoId}?autoplay=false&loop=false&muted=false&responsive=true&preload=false`;
}

/* ── Bunny iframe player ── */
function BunnyPlayer({ rec }) {
  const embedUrl = buildEmbedUrl(rec);
  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center text-gray-500 text-sm">
        Video not available yet
      </div>
    );
  }
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={rec.title}
      />
    </div>
  );
}

/* ── Single recording card ── */
function RecordingCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const batchNames = rec.batches?.map((b) => b.name).join(', ') || null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Info row */}
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div
          className="relative w-40 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
          onClick={() => setExpanded((v) => !v)}
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

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {rec.title}
          </h3>

          {rec.liveClass?.title && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Live class: {rec.liveClass.title}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDuration(rec.duration)}
            </span>
            {rec.course?.title && (
              <span className="flex items-center gap-1">
                <BookOpen size={12} /> {rec.course.title}
              </span>
            )}
            {batchNames && (
              <span className="flex items-center gap-1">
                <Users size={12} /> {batchNames}
              </span>
            )}
            <span className="text-gray-400">{formatDate(rec.recordedAt)}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="self-center p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 flex-shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Player */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <BunnyPlayer rec={rec} />
        </div>
      )}
    </div>
  );
}

/* ── Course group ── */
function CourseGroup({ courseName, courseThumbnail, batches, recordings }) {
  const [open, setOpen] = useState(true);
  const batchLabel = batches?.length ? batches.map((b) => b.name).join(', ') : null;

  return (
    <div className="space-y-3">
      {/* Course header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 text-left"
      >
        {courseThumbnail ? (
          <img src={courseThumbnail} alt={courseName}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-indigo-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{courseName}</p>
          {batchLabel && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Users size={11} /> {batchLabel}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
               : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="space-y-3 pl-13">
          {recordings.map((rec) => (
            <RecordingCard key={rec._id} rec={rec} />
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

  useEffect(() => {
    setLoading(true);
    getRecordings({ ...(courseId ? { courseId } : {}), status: 'ready' })
      .then(setRecordings)
      .catch(() => setError('Could not load recordings'))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Group by course
  const byCourse = recordings.reduce((acc, rec) => {
    const key  = rec.course?._id || 'other';
    const name = rec.course?.title || 'Other';
    if (!acc[key]) {
      acc[key] = {
        name,
        thumbnail: rec.course?.thumbnail || null,
        batches:   rec.batches || [],
        items:     [],
      };
    }
    acc[key].items.push(rec);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Video size={24} className="text-indigo-500" />
          Recorded Sessions
        </h1>
        <p className="text-gray-500 text-sm mt-1">
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
          <p className="text-sm mt-1">Recorded live sessions will appear here once they are ready</p>
        </div>
      )}

      {!loading && !error && Object.entries(byCourse).map(([cid, group]) => (
        <CourseGroup
          key={cid}
          courseName={group.name}
          courseThumbnail={group.thumbnail}
          batches={group.batches}
          recordings={group.items}
        />
      ))}
    </div>
  );
}
