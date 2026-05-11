import React, { useEffect, useState } from 'react';
import {
  Video, Trash2, ExternalLink, Clock, HardDrive,
  CheckCircle2, Loader2, AlertCircle, RefreshCw, BookOpen, Users,
} from 'lucide-react';
import { getRecordings, deleteRecording } from '../../api/recordings';
import toast from 'react-hot-toast';

function formatDuration(s) {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes > 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  return `${(bytes / 1048576).toFixed(0)} MB`;
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_BADGE = {
  uploading:  { label: 'Uploading',   cls: 'bg-blue-100 text-blue-700',    Icon: Loader2      },
  processing: { label: 'Processing',  cls: 'bg-yellow-100 text-yellow-700', Icon: Loader2      },
  ready:      { label: 'Ready',       cls: 'bg-green-100 text-green-700',   Icon: CheckCircle2 },
  failed:     { label: 'Failed',      cls: 'bg-red-100 text-red-700',       Icon: AlertCircle  },
};

function buildEmbedUrl(rec) {
  if (!rec.bunnyVideoId || !rec.bunnyLibraryId) return null;
  return `https://iframe.mediadelivery.net/embed/${rec.bunnyLibraryId}/${rec.bunnyVideoId}?autoplay=false&responsive=true`;
}

/* ── Course + batch group ── */
function CourseGroup({ courseName, courseThumbnail, batches, recordings, onDelete, deletingId }) {
  const [open, setOpen] = useState(true);
  const [embedOpen, setEmbedOpen] = useState(null);
  const batchLabel = batches?.length ? batches.map((b) => b.name).join(', ') : null;

  return (
    <div className="space-y-3">
      {/* Course header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 text-left bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 hover:bg-indigo-100 transition-colors"
      >
        {courseThumbnail ? (
          <img src={courseThumbnail} alt={courseName}
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-white shadow" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-indigo-200 flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} className="text-indigo-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{courseName}</p>
          {batchLabel && (
            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
              <Users size={11} /> Batch: {batchLabel}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500 font-medium flex-shrink-0 mr-2">
          {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 ml-2">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Instructor</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium">Size</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Recorded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recordings.map((rec) => {
                  const badge = STATUS_BADGE[rec.status] || STATUS_BADGE.failed;
                  return (
                    <tr key={rec._id} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{rec.title}</p>
                        {rec.liveClass?.title && (
                          <p className="text-xs text-gray-400 truncate">{rec.liveClass.title}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {rec.instructor?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> {formatDuration(rec.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <HardDrive size={13} /> {formatSize(rec.size)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                          <badge.Icon size={11} className={rec.status !== 'ready' && rec.status !== 'failed' ? 'animate-spin' : ''} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(rec.recordedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {rec.status === 'ready' && buildEmbedUrl(rec) && (
                            <button
                              onClick={() => setEmbedOpen(buildEmbedUrl(rec))}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                              title="Preview"
                            >
                              <ExternalLink size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(rec)}
                            disabled={deletingId === rec._id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            {deletingId === rec._id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Preview modal scoped to this group */}
          {embedOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setEmbedOpen(null)}
            >
              <div
                className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="aspect-video">
                  <iframe
                    src={embedOpen}
                    className="w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Recording preview"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InstructorRecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    getRecordings()
      .then(setRecordings)
      .catch(() => toast.error('Could not load recordings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete "${rec.title}"? This cannot be undone.`)) return;
    setDeletingId(rec._id);
    try {
      await deleteRecording(rec._id);
      setRecordings((prev) => prev.filter((r) => r._id !== rec._id));
      toast.success('Recording deleted');
    } catch {
      toast.error('Could not delete recording');
    } finally {
      setDeletingId(null);
    }
  };

  // Group by course
  const byCourse = recordings.reduce((acc, rec) => {
    const key  = rec.course?._id || 'uncategorised';
    const name = rec.course?.title || 'Uncategorised';
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

  const total      = recordings.length;
  const ready      = recordings.filter((r) => r.status === 'ready').length;
  const processing = recordings.filter((r) => r.status === 'processing' || r.status === 'uploading').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video size={24} className="text-indigo-500" />
            My Recordings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Session recordings from your live classes, grouped by course &amp; batch
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total',      value: total,      color: 'text-indigo-600' },
            { label: 'Ready',      value: ready,      color: 'text-green-600'  },
            { label: 'Processing', value: processing, color: 'text-yellow-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      )}

      {!loading && total === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Video size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recordings yet</p>
          <p className="text-sm">Recordings will appear here after a live session is completed</p>
        </div>
      )}

      {!loading && Object.entries(byCourse).map(([cid, group]) => (
        <CourseGroup
          key={cid}
          courseName={group.name}
          courseThumbnail={group.thumbnail}
          batches={group.batches}
          recordings={group.items}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      ))}
    </div>
  );
}
