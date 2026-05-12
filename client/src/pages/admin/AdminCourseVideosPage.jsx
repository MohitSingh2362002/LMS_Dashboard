import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as tus from 'tus-js-client';
import toast from 'react-hot-toast';
import api from '../../api/client';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (s) => {
  if (!s) return '0m';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const buildEmbedUrl = (v) =>
  v?.bunnyVideoId && v?.bunnyLibraryId
    ? `https://iframe.mediadelivery.net/embed/${v.bunnyLibraryId}/${v.bunnyVideoId}?autoplay=false&responsive=true&preload=false`
    : null;

// ── icons ─────────────────────────────────────────────────────────────────────
const IcVideo    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>;
const IcUpload   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></svg>;
const IcPlay     = () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IcTrash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
const IcEdit     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IcClose    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IcBack     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IcClock    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

// Status dot
const STATUS = {
  ready:      { dot: 'bg-emerald-400', label: 'Ready',      text: 'text-emerald-700 bg-emerald-50' },
  processing: { dot: 'bg-amber-400 animate-pulse', label: 'Processing', text: 'text-amber-700 bg-amber-50' },
  uploading:  { dot: 'bg-blue-400 animate-pulse',  label: 'Uploading',  text: 'text-blue-700 bg-blue-50'   },
  failed:     { dot: 'bg-rose-400',  label: 'Failed',     text: 'text-rose-700 bg-rose-50'     },
};
const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.failed;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ video, onClose }) {
  const url = buildEmbedUrl(video);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/70 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between rounded-t-2xl bg-brand-ink px-5 py-4">
          <div className="min-w-0">
            <p className="font-semibold text-white leading-snug truncate">{video.title}</p>
            {video.description && <p className="mt-0.5 text-xs text-slate-400 truncate">{video.description}</p>}
          </div>
          <button onClick={onClose} className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"><IcClose /></button>
        </div>
        <div className="aspect-video rounded-b-2xl overflow-hidden bg-slate-900 shadow-2xl">
          {url
            ? <iframe src={url} className="h-full w-full" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture" allowFullScreen title={video.title} />
            : <div className="flex h-full items-center justify-center text-slate-400 text-sm">Video not available yet</div>}
        </div>
      </div>
    </div>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────
function UploadModal({ courseId, onClose, onDone }) {
  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [file, setFile]             = useState(null);
  const [phase, setPhase]           = useState('idle');   // idle | uploading | done | error
  const [progress, setProgress]     = useState(0);
  const uploadRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('video/')) setFile(f);
  };

  const cancel = () => {
    if (uploadRef.current) uploadRef.current.abort();
    onClose();
  };

  const start = async () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    if (!file)         { toast.error('Please select a video file'); return; }

    setPhase('uploading');
    setProgress(0);

    try {
      // 1. Init — create Bunny video entry + DB placeholder
      const { data: init } = await api.post(`/courses/${courseId}/videos/init`, {
        title: title.trim(),
        description: description.trim(),
        size: file.size,
      });

      if (!init.bunnyVideoId) {
        throw new Error('Bunny Stream is not configured on the server. Check BUNNY_STREAM_* env vars.');
      }

      const { videoId, bunnyVideoId, libraryId, tusEndpoint, signature, expiryTs } = init;

      // 2. TUS upload
      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 3000, 5000, 10000],
          chunkSize: 5 * 1024 * 1024, // 5 MB chunks
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire:    String(expiryTs),
            VideoId:                bunnyVideoId,
            LibraryId:              String(libraryId),
          },
          metadata: {
            filetype: file.type,
            title:    title.trim(),
          },
          onProgress(bytesUploaded, bytesTotal) {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess() { resolve(); },
          onError(err) { reject(err); },
        });
        uploadRef.current = upload;
        upload.start();
      });

      // 3. Complete
      await api.post(`/courses/${courseId}/videos/${videoId}/complete`, {
        duration: 0,
        size: file.size,
      });

      setPhase('done');
      toast.success('Upload complete! Video is processing…');
      onDone();
    } catch (err) {
      console.error('[UploadModal]', err);
      setPhase('error');
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={phase === 'idle' ? onClose : undefined}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 font-bold text-brand-ink"><IcUpload /><span>Upload Course Video</span></div>
          {phase !== 'uploading' && <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"><IcClose /></button>}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Title <span className="text-rose-500">*</span></label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to React Hooks"
              disabled={phase === 'uploading' || phase === 'done'}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:bg-slate-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={description} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="Brief description of this lesson…"
              disabled={phase === 'uploading' || phase === 'done'}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:bg-slate-50"
            />
          </div>

          {/* File drop zone */}
          {phase === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 transition-colors ${file ? 'border-brand-accent bg-brand-surface/40' : 'border-slate-200 hover:border-brand-accent/50 hover:bg-brand-surface/20'}`}
            >
              {file ? (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-surface text-brand-accent"><IcVideo /></div>
                  <p className="text-sm font-semibold text-brand-ink truncate max-w-full">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  <button onClick={() => setFile(null)} className="text-xs text-rose-500 hover:underline">Remove</button>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><IcUpload /></div>
                  <p className="text-sm text-slate-500">Drag & drop a video file, or</p>
                  <label className="cursor-pointer rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary transition-colors">
                    Browse Files
                    <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
                  </label>
                  <p className="text-xs text-slate-400">MP4, MOV, MKV, WebM — max 10 GB</p>
                </>
              )}
            </div>
          )}

          {/* Progress */}
          {phase === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Uploading to Bunny Stream…</span>
                <span className="font-semibold text-brand-ink">{progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-accent transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-400 text-center">Please keep this window open while uploading.</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="font-semibold text-brand-ink">Upload successful!</p>
              <p className="text-sm text-slate-500">Bunny Stream is transcoding the video. It will appear as <strong>Ready</strong> once processing finishes.</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Upload failed. Please check your Bunny Stream settings and try again.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          {phase === 'done' || phase === 'error' ? (
            <button onClick={onClose} className="rounded-xl bg-brand-accent px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary transition-colors">Close</button>
          ) : (
            <>
              <button onClick={cancel} disabled={false} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                {phase === 'uploading' ? 'Cancel Upload' : 'Cancel'}
              </button>
              <button
                onClick={start}
                disabled={phase === 'uploading' || !file || !title.trim()}
                className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IcUpload />
                {phase === 'uploading' ? `Uploading ${progress}%…` : 'Start Upload'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit title/description modal ──────────────────────────────────────────────
function EditModal({ video, courseId, onClose, onDone }) {
  const [title, setTitle] = useState(video.title);
  const [desc,  setDesc]  = useState(video.description || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await api.put(`/courses/${courseId}/videos/${video._id}`, { title: title.trim(), description: desc.trim() });
      toast.success('Video updated');
      onDone();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="font-bold text-brand-ink">Edit Video</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><IcClose /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-brand-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving}
            className="rounded-xl bg-brand-accent px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const IcRefresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>;

export default function AdminCourseVideosPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [videos,   setVideos]   = useState([]);
  const [course,   setCourse]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [showUpload, setUpload] = useState(false);
  const [previewing, setPreview]= useState(null);
  const [editing,    setEdit]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, videosRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/videos`),
      ]);
      setCourse(courseRes.data);
      setVideos(videosRes.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Sync: asks the server to query Bunny directly and update processing statuses
  const sync = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const { data } = await api.post(`/courses/${courseId}/videos/sync`);
      setVideos(data);
      if (!silent) {
        const ready = data.filter((v) => v.status === 'ready').length;
        toast.success(`Status refreshed — ${ready} video${ready !== 1 ? 's' : ''} ready`);
      }
    } catch (e) {
      if (!silent) toast.error(e.response?.data?.message || 'Sync failed');
    } finally {
      if (!silent) setSyncing(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  // Auto-poll Bunny every 12 s while any video is still processing/uploading
  useEffect(() => {
    const hasPending = videos.some((v) => v.status === 'processing' || v.status === 'uploading');
    if (!hasPending) return;
    const t = setInterval(() => sync(true), 12000);
    return () => clearInterval(t);
  }, [videos, sync]);

  const handleDelete = async (v) => {
    if (!window.confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/courses/${courseId}/videos/${v._id}`);
      toast.success('Video deleted');
      setVideos((prev) => prev.filter((x) => x._id !== v._id));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const readyCount     = videos.filter((v) => v.status === 'ready').length;
  const processingCount= videos.filter((v) => v.status === 'processing' || v.status === 'uploading').length;
  const totalDuration  = videos.filter((v) => v.status === 'ready').reduce((s, v) => s + (v.duration || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/courses')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <IcBack /> Courses
          </button>
          <div>
            <h1 className="text-xl font-bold text-brand-ink">Course Videos</h1>
            {course && <p className="text-sm text-slate-500">{course.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {processingCount > 0 && (
            <button
              onClick={() => sync(false)}
              disabled={syncing}
              title="Check Bunny Stream for latest transcoding status"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <span className={syncing ? 'animate-spin' : ''}><IcRefresh /></span>
              {syncing ? 'Checking…' : 'Refresh Status'}
            </button>
          )}
          <button
            onClick={() => setUpload(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary transition-colors"
          >
            <IcUpload /> Upload Video
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Videos', value: videos.length },
          { label: 'Ready',        value: readyCount,      accent: 'text-emerald-600' },
          { label: 'Processing',   value: processingCount, accent: 'text-amber-600' },
        ].map(({ label, value, accent = 'text-brand-primary' }) => (
          <div key={label} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card text-center">
            <p className={`text-2xl font-bold ${accent}`}>{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading videos…</p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 gap-4 shadow-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent">
            <IcVideo />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-600">No videos yet</p>
            <p className="mt-1 text-sm text-slate-400">Upload pre-recorded lectures for this course</p>
          </div>
          <button
            onClick={() => setUpload(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary transition-colors"
          >
            <IcUpload /> Upload First Video
          </button>
        </div>
      )}

      {/* ── Video list ── */}
      {!loading && videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((v, idx) => {
            const canPlay = v.status === 'ready' && buildEmbedUrl(v);
            return (
              <div key={v._id} className="group flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card hover:shadow-cardHover transition-shadow">
                {/* Thumbnail / number */}
                <div
                  onClick={() => canPlay && setPreview(v)}
                  className={`relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 ${canPlay ? 'cursor-pointer' : ''}`}
                >
                  {v.thumbnailUrl
                    ? <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />
                    : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-300 gap-1">
                        <IcVideo />
                        <span className="text-[10px]">#{idx + 1}</span>
                      </div>
                    )
                  }
                  {canPlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-ink/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-accent shadow-lg">
                        <IcPlay />
                      </div>
                    </div>
                  )}
                  {v.duration > 0 && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-brand-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {fmt(v.duration)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start gap-2">
                      <h4 className="flex-1 font-semibold text-brand-ink text-sm leading-snug line-clamp-1">{v.title}</h4>
                      <StatusBadge status={v.status} />
                    </div>
                    {v.description && <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{v.description}</p>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                    {v.duration > 0 && <span className="flex items-center gap-1"><IcClock />{fmt(v.duration)}</span>}
                    <span className="text-slate-300">·</span>
                    <span>Lesson {idx + 1}</span>
                    {v.status === 'processing' && (
                      <span className="text-amber-600">Transcoding in progress…</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canPlay && (
                    <button onClick={() => setPreview(v)} title="Preview"
                      className="flex items-center gap-1.5 rounded-xl bg-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-accent hover:bg-brand-accent hover:text-white transition-colors">
                      <IcPlay /> Preview
                    </button>
                  )}
                  <button onClick={() => setEdit(v)} title="Edit"
                    className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-brand-ink transition-colors">
                    <IcEdit />
                  </button>
                  <button onClick={() => handleDelete(v)} title="Delete"
                    className="rounded-xl border border-rose-100 p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                    <IcTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Total duration footer ── */}
      {!loading && readyCount > 0 && (
        <p className="text-right text-xs text-slate-400">
          {readyCount} ready video{readyCount !== 1 ? 's' : ''} · Total duration: {fmt(totalDuration)}
        </p>
      )}

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          courseId={courseId}
          onClose={() => setUpload(false)}
          onDone={() => { setUpload(false); load(); }}
        />
      )}
      {previewing && <PreviewModal video={previewing} onClose={() => setPreview(null)} />}
      {editing && (
        <EditModal
          video={editing}
          courseId={courseId}
          onClose={() => setEdit(null)}
          onDone={() => { setEdit(null); load(); }}
        />
      )}
    </div>
  );
}
