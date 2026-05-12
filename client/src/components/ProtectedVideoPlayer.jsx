/**
 * ProtectedVideoPlayer
 *
 * Wraps a Bunny Stream iframe with a suite of piracy-deterrent measures:
 *  1. Rotating semi-transparent watermark overlay (user name + email)
 *     — pointer-events: none so player controls still work
 *     — always visible in screen recordings
 *  2. Page-visibility & window-blur detection
 *     — shows a warning banner + logs to server when the tab is hidden
 *  3. Right-click prevention on the player wrapper
 *  4. Keyboard-shortcut blocking (PrintScreen, Ctrl+P/S/Shift+S)
 *  5. DevTools-open detection via window resize anomaly
 *  6. Server logging: view-start, view-end (with duration), tab-switch, devtools-detected
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDur = (s) => {
  if (!s || s < 1) return '< 1m';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── icons ─────────────────────────────────────────────────────────────────────
const IcShield  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcWarn    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcClose   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcEye     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

// ── Warning banner ────────────────────────────────────────────────────────────
function WarnBanner({ message, onDismiss }) {
  return (
    <div className="absolute inset-x-0 top-0 z-40 flex items-center gap-3 bg-rose-600 px-4 py-3 text-white animate-fadeIn">
      <IcWarn />
      <p className="flex-1 text-sm font-semibold">{message}</p>
      <button onClick={onDismiss} className="rounded p-1 hover:bg-white/20 transition-colors"><IcClose /></button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProtectedVideoPlayer({
  embedUrl,
  title,
  courseId,
  enrollmentId,
  videoId,
  onClose,
}) {
  const { user } = useAuth();
  const startRef   = useRef(Date.now());
  const warnCount  = useRef(0);
  const [warning,  setWarning]  = useState(null);
  const [devtools, setDevtools] = useState(false);

  // ── Server logging ──────────────────────────────────────────────────────────
  const log = useCallback(async (action, metadata = {}) => {
    try {
      await api.post('/security/content-logs', {
        course:      courseId,
        enrollment:  enrollmentId,
        action,
        resource:    videoId || title || 'video',
        metadata:    { title, ...metadata },
      });
    } catch { /* never block playback */ }
  }, [courseId, enrollmentId, videoId, title]);

  // ── Mount: log view start ───────────────────────────────────────────────────
  useEffect(() => {
    log('video-view-start');
    return () => {
      const secs = Math.round((Date.now() - startRef.current) / 1000);
      log('video-view-end', { watchedSeconds: secs, watchedLabel: fmtDur(secs) });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tab visibility & window blur ────────────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        warnCount.current += 1;
        setWarning('⚠️  Tab switch detected while video is playing. This activity is logged.');
        log('tab-switch-detected', { count: warnCount.current });
      }
    };
    const onBlur = () => {
      // Window blur fires when DevTools opens or user alt-tabs
      // Only log — don't show banner for normal window switches
      log('window-blur');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [log]);

  // ── DevTools detection (window-height anomaly) ──────────────────────────────
  useEffect(() => {
    const THRESHOLD = 160; // px — DevTools panel takes at least this much
    const check = () => {
      const diff = window.outerHeight - window.innerHeight;
      if (diff > THRESHOLD && !devtools) {
        setDevtools(true);
        setWarning('🔍  Developer tools detected. This session has been flagged and logged.');
        log('devtools-detected', { heightDiff: diff });
      } else if (diff <= THRESHOLD && devtools) {
        setDevtools(false);
      }
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [devtools, log]);

  // ── Keyboard blocking ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      const blocked =
        k === 'printscreen' ||
        ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(k)) ||
        (e.ctrlKey && e.shiftKey && k === 's'); // win snipping

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        setWarning('⛔  Screenshot / print shortcut blocked. This attempt has been logged.');
        log('blocked-shortcut', { key: e.key });
      }
    };
    window.addEventListener('keydown', onKey, true); // capture phase
    return () => window.removeEventListener('keydown', onKey, true);
  }, [log]);

  // ── Right-click block ───────────────────────────────────────────────────────
  const onContextMenu = (e) => {
    e.preventDefault();
    log('blocked-context-menu');
  };

  // ── Watermark text ──────────────────────────────────────────────────────────
  const watermark = user
    ? `${user.name}  ·  ${user.email}`
    : 'EduMaster LMS';

  return (
    <div
      className="relative w-full"
      onContextMenu={onContextMenu}
    >
      {/* ── Warning banner ── */}
      {warning && (
        <WarnBanner message={warning} onDismiss={() => setWarning(null)} />
      )}

      {/* ── Video iframe + watermark (positioned together) ── */}
      {/*
        IMPORTANT: position:relative here is mandatory.
        The watermark overlay uses absolute inset-0 — it must be anchored
        to this box, not to some ancestor. Without relative, the overlay
        escapes the video area entirely.
      */}
      <div className="relative aspect-video w-full bg-slate-950 shadow-2xl overflow-hidden"
           style={{ borderRadius: '0 0 1rem 1rem' }}>

        {/* Iframe */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm">
            Video not available
          </div>
        )}

        {/* ── Watermark overlay ──────────────────────────────────────────────
            pointer-events: none  → player controls still work underneath
            z-index: 10           → renders on top of the iframe layer
            Always visible while the modal is open — captured by any screen
            recorder that records the browser window / tab.
        ─────────────────────────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
          }}
        >
          {/* Corner badge — top left */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 12,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            borderRadius: 6,
            padding: '4px 8px',
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>{watermark}</span>
          </div>

          {/* Corner badge — bottom right */}
          <div style={{
            position: 'absolute',
            bottom: 40,   // above the Bunny player controls bar
            right: 12,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            borderRadius: 6,
            padding: '4px 8px',
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>{watermark}</span>
          </div>

          {/* Diagonal ghost watermark — centre of video
              Opacity 0.18 = clearly visible in recordings but doesn't
              distract during normal viewing */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <span style={{
              transform: 'rotate(-25deg)',
              fontSize: 15,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.18)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}>
              {watermark}&nbsp;&nbsp;&nbsp;&nbsp;{watermark}&nbsp;&nbsp;&nbsp;&nbsp;{watermark}
            </span>
          </div>
        </div>
      </div>

      {/* ── Security badge (bottom bar) ── */}
      <div className="flex items-center justify-between rounded-b-none border-t border-white/5 bg-slate-900 px-4 py-2">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <IcShield />
          <span>Content protected · Unauthorised recording is prohibited</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <IcEye />
          <span className="truncate max-w-[200px]">{watermark}</span>
        </div>
      </div>
    </div>
  );
}
