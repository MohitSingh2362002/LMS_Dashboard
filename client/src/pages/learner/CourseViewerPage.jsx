import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import ProtectedContentFrame from "../../components/ProtectedContentFrame";
import ProtectedVideoPlayer from "../../components/ProtectedVideoPlayer";
import { formatDate, formatFileSize, getFullFileUrl, getLiveTestStatus } from "../../utils/helpers";

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDur = (s) => {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const buildEmbed = (v) =>
  v?.bunnyVideoId && v?.bunnyLibraryId
    ? `https://iframe.mediadelivery.net/embed/${v.bunnyLibraryId}/${v.bunnyVideoId}?autoplay=true&responsive=true&preload=false`
    : null;

// ── icons ─────────────────────────────────────────────────────────────────────
const IcPlay    = () => <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcCheck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IcClock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcClose   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcChevL   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="15 18 9 12 15 6"/></svg>;
const IcChevR   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="9 18 15 12 9 6"/></svg>;
const IcBook    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const IcVideo   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>;
const IcNote    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IcTest    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcPDF     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcExtLink = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const IcBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="15 18 9 12 15 6"/></svg>;

// ── Video player modal ────────────────────────────────────────────────────────
function VideoPlayerModal({ video, enrollmentId, courseId, onClose }) {
  const url = buildEmbed(video);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-brand-ink px-5 py-3.5">
          <div className="min-w-0">
            <p className="font-semibold text-white leading-snug truncate">{video.title}</p>
            {video.description && (
              <p className="mt-0.5 text-xs text-slate-400 truncate">{video.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <IcClose />
          </button>
        </div>
        {/* Protected player */}
        <ProtectedVideoPlayer
          embedUrl={url}
          title={video.title}
          courseId={courseId}
          enrollmentId={enrollmentId}
          videoId={video._id}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const CourseViewerPage = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { data: enrollments, loading, refresh } = useFetch(() => api.get("/enrollments/mine"), []);

  const [activeIndex,   setActiveIndex]   = useState(0);
  const [activeTab,     setActiveTab]     = useState('lessons');
  const [courseVideos,  setCourseVideos]  = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [playingVideo,  setPlayingVideo]  = useState(null);
  const [completing,    setCompleting]    = useState(false);

  const enrollment = useMemo(
    () => enrollments.find((e) => e._id === enrollmentId),
    [enrollments, enrollmentId]
  );

  useEffect(() => {
    if (!enrollment?.course?._id) return;
    setVideosLoading(true);
    api.get(`/courses/${enrollment.course._id}/videos`)
      .then((r) => setCourseVideos(r.data || []))
      .catch(() => setCourseVideos([]))
      .finally(() => setVideosLoading(false));
  }, [enrollment?.course?._id]);

  if (loading) return <Loader label="Loading course…" />;
  if (!enrollment) return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-16 shadow-panel gap-4">
      <p className="text-lg font-semibold text-slate-600">Course not found.</p>
      <button onClick={() => navigate('/learner')} className="rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white">Back to My Courses</button>
    </div>
  );

  const pages        = enrollment.course?.pages     || [];
  const notes        = enrollment.course?.notes     || [];
  const noteFiles    = enrollment.course?.noteFiles || [];
  const liveTest     = enrollment.course?.liveTest  || {};
  const liveTestSt   = getLiveTestStatus(liveTest);
  const activePage   = pages[activeIndex];
  const readyVideos  = courseVideos.filter((v) => v.status === 'ready');
  const progress     = enrollment.progress || 0;

  const TABS = [
    { id: 'lessons', label: 'Lessons', icon: <IcBook />,  count: pages.length },
    { id: 'videos',  label: 'Videos',  icon: <IcVideo />, count: readyVideos.length },
    { id: 'notes',   label: 'Notes',   icon: <IcNote />,  count: notes.length + noteFiles.length },
    { id: 'test',    label: 'Test',    icon: <IcTest />,  count: null },
  ];

  const TEST_BADGE = {
    amber:   'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate:   'bg-slate-100 text-slate-500',
  };

  const markComplete = async () => {
    setCompleting(true);
    try {
      await api.put(`/enrollments/${enrollment._id}/progress`, { completedPageIndex: activeIndex });
      toast.success('Progress saved!');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update progress');
    } finally {
      setCompleting(false);
    }
  };

  const logDownload = async (noteFile) => {
    try {
      await api.post('/security/content-logs', {
        course: enrollment.course?._id,
        enrollment: enrollment._id,
        action: 'download',
        resource: noteFile.path,
        metadata: { name: noteFile.name },
      });
    } catch { /* silent */ }
  };

  return (
    <ProtectedContentFrame
      course={enrollment.course?._id}
      enrollment={enrollment._id}
      resource={activePage?.title || 'course-page'}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">

        {/* ════════════════════════════════════════
            SIDEBAR
        ════════════════════════════════════════ */}
        <aside className="w-full flex-shrink-0 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-72">

          {/* Course header */}
          <div className="bg-gradient-to-br from-brand-primary to-brand-accent px-5 pt-5 pb-4">
            <button
              onClick={() => navigate('/learner')}
              className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
            >
              <IcBack /> My Courses
            </button>
            <h2 className="text-sm font-bold text-white leading-snug line-clamp-3">
              {enrollment.course?.title}
            </h2>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-white/70 mb-1.5">
                <span>Progress</span>
                <span className="font-semibold text-white">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex border-b border-slate-100">
            {TABS.map(({ id, label, icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  activeTab === id
                    ? 'border-b-2 border-brand-accent text-brand-accent'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {icon}
                <span>{label}{count !== null && count > 0 ? ` (${count})` : ''}</span>
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="max-h-[46vh] flex-1 overflow-y-auto lg:max-h-none">

            {/* LESSONS */}
            {activeTab === 'lessons' && (
              <div className="p-3 space-y-1">
                {pages.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">No lessons published yet.</p>
                )}
                {pages.map((page, idx) => (
                  <button
                    key={`page-${idx}`}
                    onClick={() => setActiveIndex(idx)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                      activeIndex === idx
                        ? 'bg-brand-accent text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${
                      activeIndex === idx ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-surface group-hover:text-brand-accent'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="flex-1 text-xs font-medium leading-snug line-clamp-2">{page.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* VIDEOS */}
            {activeTab === 'videos' && (
              <div className="p-3 space-y-1">
                {videosLoading && (
                  <div className="flex justify-center py-8">
                    <div className="h-5 w-5 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
                  </div>
                )}
                {!videosLoading && readyVideos.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">No recorded classes yet.</p>
                )}
                {!videosLoading && readyVideos.map((v, idx) => (
                  <button
                    key={v._id}
                    onClick={() => setPlayingVideo(v)}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-brand-surface transition-colors"
                  >
                    {/* Mini thumbnail */}
                    <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent">
                      {v.thumbnailUrl && (
                        <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-accent">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                      {v.duration > 0 && (
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[8px] font-semibold text-white">
                          {fmtDur(v.duration)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-brand-ink leading-snug line-clamp-2">{idx + 1}. {v.title}</p>
                      {v.duration > 0 && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <IcClock />{fmtDur(v.duration)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className="p-3 space-y-2">
                {!notes.length && !noteFiles.length && (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">No notes published yet.</p>
                )}
                {noteFiles.map((f, i) => (
                  <a
                    key={i}
                    href={getFullFileUrl(f.path)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => logDownload(f)}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-brand-accent/30 hover:bg-brand-surface transition-all"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                      <IcPDF />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-brand-ink">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(f.size)} · PDF</p>
                    </div>
                    <IcExtLink />
                  </a>
                ))}
                {notes.map((n, i) => (
                  <details key={i} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 hover:bg-brand-surface/50 transition-colors">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-brand-surface text-[10px] font-bold text-brand-accent">
                        {i + 1}
                      </div>
                      <span className="flex-1 truncate text-xs font-semibold text-brand-ink">{n.title}</span>
                    </summary>
                    <div
                      className="prose prose-sm prose-slate max-w-none border-t border-slate-100 px-3 py-3 text-xs"
                      dangerouslySetInnerHTML={{ __html: n.content || '' }}
                    />
                  </details>
                ))}
              </div>
            )}

            {/* TEST */}
            {activeTab === 'test' && (
              <div className="p-4">
                {liveTest.enabled ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-brand-ink">{liveTest.title}</p>
                      <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${TEST_BADGE[liveTestSt.tone]}`}>
                        {liveTestSt.label}
                      </span>
                    </div>
                    {(liveTest.startsAt || liveTest.endsAt) && (
                      <div className="grid grid-cols-2 gap-2">
                        {liveTest.startsAt && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">Starts</p>
                            <p className="mt-1 text-xs font-semibold text-brand-ink">{formatDate(liveTest.startsAt)}</p>
                          </div>
                        )}
                        {liveTest.endsAt && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">Ends</p>
                            <p className="mt-1 text-xs font-semibold text-brand-ink">{formatDate(liveTest.endsAt)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {liveTestSt.canJoin ? (
                      <a
                        href={liveTest.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent py-2.5 text-sm font-semibold text-white hover:bg-brand-primary transition-colors"
                      >
                        Open Live Test <IcExtLink />
                      </a>
                    ) : (
                      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 text-center">
                        Test link opens when the window starts
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><IcTest /></div>
                    <p className="text-xs text-slate-400">No live test is active for this course right now.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════
            MAIN CONTENT
        ════════════════════════════════════════ */}
        <div className="min-w-0 flex-1 space-y-5">

          {/* ── Lesson reader ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden">
            {/* Lesson header bar */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <IcBook />
                <span className="font-medium text-brand-ink">{enrollment.course?.title}</span>
                <span className="text-slate-300">›</span>
                <span>Lesson {activeIndex + 1} of {pages.length}</span>
              </div>
              {/* Prev / Next arrows */}
              <div className="flex items-center gap-1">
                <button
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-brand-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <IcChevL />
                </button>
                <button
                  disabled={activeIndex >= pages.length - 1}
                  onClick={() => setActiveIndex((i) => Math.min(pages.length - 1, i + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-brand-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <IcChevR />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-5 sm:px-8 sm:py-7">
              {activePage ? (
                <>
                  <h1 className="text-2xl font-bold text-brand-ink">{activePage.title}</h1>
                  <div
                    className="prose prose-slate mt-6 max-w-none"
                    dangerouslySetInnerHTML={{ __html: activePage.content || '' }}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent"><IcBook /></div>
                  <p className="font-semibold text-slate-600">No lessons yet</p>
                  <p className="text-sm text-slate-400">Your instructor hasn't published any lessons yet.</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {activePage && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <div className="grid w-full gap-2 sm:flex sm:w-auto">
                  <button
                    onClick={markComplete}
                    disabled={completing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary disabled:opacity-60 transition-colors"
                  >
                    <IcCheck /> {completing ? 'Saving…' : 'Mark as Complete'}
                  </button>
                  {activeIndex < pages.length - 1 && (
                    <button
                      onClick={() => setActiveIndex((i) => i + 1)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Next Lesson <IcChevR />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400">{progress}% of course completed</p>
              </div>
            )}
          </div>

          {/* ── Info cards row: Live Test + Class Notes ── */}
          <div className="grid gap-5 lg:grid-cols-2">

            {/* Live Test card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><IcTest /></div>
                  <p className="font-bold text-brand-ink">Live Test</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TEST_BADGE[liveTestSt.tone]}`}>
                  {liveTestSt.label}
                </span>
              </div>
              <div className="p-5">
                {liveTest.enabled ? (
                  <div className="space-y-4">
                    <p className="font-semibold text-brand-ink">{liveTest.title}</p>
                    {(liveTest.startsAt || liveTest.endsAt) && (
                      <div className="grid grid-cols-2 gap-3">
                        {liveTest.startsAt && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">Starts</p>
                            <p className="mt-1 text-xs font-semibold text-brand-ink">{formatDate(liveTest.startsAt)}</p>
                          </div>
                        )}
                        {liveTest.endsAt && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">Ends</p>
                            <p className="mt-1 text-xs font-semibold text-brand-ink">{formatDate(liveTest.endsAt)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {liveTest.instructions && (
                      <div
                        className="prose prose-sm prose-slate max-w-none rounded-xl bg-slate-50 p-4 text-xs"
                        dangerouslySetInnerHTML={{ __html: liveTest.instructions }}
                      />
                    )}
                    {liveTestSt.canJoin ? (
                      <a
                        href={liveTest.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent py-2.5 text-sm font-semibold text-white hover:bg-brand-primary transition-colors"
                      >
                        Open Live Test <IcExtLink />
                      </a>
                    ) : (
                      <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
                        Test link becomes active when the window opens
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <p className="text-sm text-slate-500">No live test is active right now.</p>
                    <p className="text-xs text-slate-400">Your instructor will publish a test here when ready.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Class Notes card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-surface text-brand-accent"><IcNote /></div>
                <p className="font-bold text-brand-ink">Class Notes</p>
                {(notes.length + noteFiles.length) > 0 && (
                  <span className="ml-auto rounded-full bg-brand-surface px-2.5 py-1 text-[10px] font-bold text-brand-accent">
                    {notes.length + noteFiles.length} item{notes.length + noteFiles.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="p-5">
                {!notes.length && !noteFiles.length ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <p className="text-sm text-slate-500">No notes published yet.</p>
                    <p className="text-xs text-slate-400">Your instructor's notes and PDFs will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {noteFiles.map((f, i) => (
                      <a
                        key={i}
                        href={getFullFileUrl(f.path)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => logDownload(f)}
                        className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-brand-accent/30 hover:bg-brand-surface/50 transition-all"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 group-hover:bg-rose-100 transition-colors">
                          <IcPDF />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-brand-ink">{f.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(f.size)}{f.uploadedAt ? ` · ${formatDate(f.uploadedAt)}` : ''}</p>
                        </div>
                        <span className="hidden sm:flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 group-hover:bg-brand-accent group-hover:text-white transition-colors">
                          Open <IcExtLink />
                        </span>
                      </a>
                    ))}
                    {notes.map((n, i) => (
                      <details key={i} className="group rounded-xl border border-slate-100 overflow-hidden">
                        <summary className="flex cursor-pointer list-none items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-accent text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-brand-ink">{n.title}</p>
                            {n.createdAt && <p className="text-xs text-slate-400">Shared {formatDate(n.createdAt)}</p>}
                          </div>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </summary>
                        <div
                          className="prose prose-sm prose-slate max-w-none border-t border-slate-100 px-5 py-4"
                          dangerouslySetInnerHTML={{ __html: n.content || '' }}
                        />
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Recorded Classes ── */}
          {(readyVideos.length > 0 || videosLoading) && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-surface text-brand-accent"><IcVideo /></div>
                  <div>
                    <p className="font-bold text-brand-ink">Recorded Classes</p>
                    <p className="text-[11px] text-slate-400">Pre-recorded lessons — watch at your own pace</p>
                  </div>
                </div>
                {readyVideos.length > 0 && (
                  <span className="rounded-full bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-accent">
                    {readyVideos.length} video{readyVideos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {videosLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {readyVideos.map((v, idx) => (
                    <div
                      key={v._id}
                      onClick={() => setPlayingVideo(v)}
                      className="group flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-[60px] w-[100px] flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent">
                        {v.thumbnailUrl && (
                          <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />
                        )}
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg text-brand-accent">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 translate-x-[1px]"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </div>
                        </div>
                        {/* Duration badge */}
                        {v.duration > 0 && (
                          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {fmtDur(v.duration)}
                          </span>
                        )}
                        {/* Lesson number */}
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-brand-ink text-sm leading-snug line-clamp-1 group-hover:text-brand-accent transition-colors">
                          {v.title}
                        </p>
                        {v.description && (
                          <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{v.description}</p>
                        )}
                        {v.duration > 0 && (
                          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                            <IcClock />{fmtDur(v.duration)}
                          </p>
                        )}
                      </div>

                      {/* Watch button */}
                      <button className="hidden sm:flex items-center gap-1.5 rounded-xl bg-brand-accent px-3.5 py-2 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-brand-primary">
                        <IcPlay /> Watch
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Video Player Modal ── */}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          enrollmentId={enrollment._id}
          courseId={enrollment.course?._id}
          onClose={() => setPlayingVideo(null)}
        />
      )}
    </ProtectedContentFrame>
  );
};

export default CourseViewerPage;
