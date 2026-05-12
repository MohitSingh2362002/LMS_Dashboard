/**
 * PWAPrompt
 *
 * Two responsibilities:
 *  1. Install prompt  — shown when the browser fires `beforeinstallprompt`
 *                       (Chrome / Edge / Android). Lets the user add the app
 *                       to their home screen without going to the app store.
 *  2. Update prompt   — shown when the service worker has a new version ready.
 *                       Lets the user reload to get the latest build immediately.
 */

import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// ── icons ──────────────────────────────────────────────────────────────────
const IcDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 flex-shrink-0">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 flex-shrink-0">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);
const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── shared toast shell ──────────────────────────────────────────────────────
function PWAToast({ icon, title, body, actions, onDismiss }) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[9999] animate-fadeIn sm:left-1/2 sm:right-auto sm:w-[calc(100vw-2rem)] sm:max-w-sm sm:-translate-x-1/2">
      <div className="flex max-h-[calc(100vh-2rem)] items-start gap-3 overflow-y-auto rounded-2xl bg-brand-ink p-3 shadow-panel sm:p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-accent/20 text-brand-accent">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">{body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white transition-colors"
        >
          <IcClose />
        </button>
      </div>
    </div>
  );
}

// ── Install prompt ──────────────────────────────────────────────────────────
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already installed — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();        // stop Chrome's mini-infobar
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <PWAToast
      icon={<IcDownload />}
      title="Install EduMaster"
      body="Add to your home screen for faster access — works offline too."
      onDismiss={() => setShow(false)}
      actions={
        <>
          <button
            onClick={install}
            className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primary transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setShow(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Not now
          </button>
        </>
      }
    />
  );
}

// ── Update prompt ───────────────────────────────────────────────────────────
function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll for updates every 60 minutes in production
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <PWAToast
      icon={<IcRefresh />}
      title="Update available"
      body="A new version of EduMaster is ready. Reload to get the latest features."
      onDismiss={() => updateServiceWorker(false)}
      actions={
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-primary transition-colors"
        >
          Reload now
        </button>
      }
    />
  );
}

// ── Combined export ─────────────────────────────────────────────────────────
export default function PWAPrompt() {
  return (
    <>
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
