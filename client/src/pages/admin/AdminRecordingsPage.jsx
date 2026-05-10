import React, { useEffect, useState } from 'react';
import {
  Video, Trash2, ExternalLink, Clock, HardDrive,
  CheckCircle2, Loader2, AlertCircle, RefreshCw,
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
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_BADGE = {
  uploading:  { label: 'Uploading',   cls: 'bg-blue-100 text-blue-700  dark:bg-blue-900/30  dark:text-blue-300',  Icon: Loader2 },
  processing: { label: 'Processing',  cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', Icon: Loader2 },
  ready:      { label: 'Ready',       cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', Icon: CheckCircle2 },
  failed:     { label: 'Failed',      cls: 'bg-red-100 text-red-700    dark:bg-red-900/30    dark:text-red-300',   Icon: AlertCircle },
};

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [embedOpen, setEmbedOpen]   = useState(null); // {id, url}

  const load = () => {
    setLoading(true);
    getRecordings()
      .then(setRecordings)
      .catch(() => toast.error('Could not load recordings'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (rec) => {
    if (!window.confirm(`Delete recording "${rec.title}"? This cannot be undone.`)) return;
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video size={24} className="text-indigo-500" />
            Recorded Sessions
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            All session recordings stored on Bunny Stream
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Video size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recordings yet</p>
          <p className="text-sm">Recordings will appear here once a host ends a session</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Course</th>
                <th className="text-left px-4 py-3 font-medium">Instructor</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Recorded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recordings.map((rec) => {
                const badge = STATUS_BADGE[rec.status] || STATUS_BADGE.failed;
                return (
                  <tr key={rec._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{rec.title}</p>
                      {rec.liveClass && (
                        <p className="text-xs text-gray-400 truncate">{rec.liveClass.title}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {rec.course?.title || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {rec.instructor?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {formatDuration(rec.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
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
                        {rec.status === 'ready' && rec.playbackUrl && (
                          <button
                            onClick={() => setEmbedOpen({ id: rec._id, url: `https://iframe.mediadelivery.net/embed/${rec.bunnyLibraryId}/${rec.bunnyVideoId}?autoplay=false&responsive=true` })}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500 transition-colors"
                            title="Preview"
                          >
                            <ExternalLink size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rec)}
                          disabled={deletingId === rec._id}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors disabled:opacity-40"
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
      )}

      {/* Preview modal */}
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
                src={embedOpen.url}
                className="w-full h-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Recording preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
