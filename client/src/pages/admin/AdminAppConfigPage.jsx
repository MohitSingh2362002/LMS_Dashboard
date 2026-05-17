import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";

const defaultConfig = {
  appName: "EduMaster",
  tagline: "Learn. Grow. Succeed.",
  primaryColor: "#1A4FA0",
  accentColor: "#2E7FD9",
  splashBgColor: "#1C1E2B",
  logoUrl: "",
  splashLogoUrl: "",
  androidApkUrl: "https://expo.dev/artifacts/eas/pVsguv3RxZZEyk7BBKRNv8.apk",
  iosTestFlightUrl: "",
  expoProjectUrl: "https://expo.dev/accounts/mohitttt/projects/edumaster-mobile",
  appVersion: "1.0.0",
  buildNumber: "1",
  releaseNotes: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function hex(color, alpha) {
  return color + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

// ── QR Code via Google Charts (no package needed) ──────────────────────────
function QRCode({ url, size = 120 }) {
  if (!url) return null;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=4&color=1A4FA0`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl border border-slate-200 shadow-sm"
    />
  );
}

// ── ImageUploadField ───────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange, hint }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post("/app-config/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
      toast.success("Image uploaded to S3!");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-ink">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder="https://… or upload ↑"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-ink transition hover:bg-slate-100 disabled:opacity-50"
        >
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
          ) : (
            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <div className="mt-2 flex items-center gap-2">
          <img src={value} alt="preview" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
          <span className="truncate text-xs text-slate-400">{value}</span>
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── ColorField ─────────────────────────────────────────────────────────────
function ColorField({ label, value, onChange }) {
  const handleHexChange = (e) => {
    const v = e.target.value;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-ink">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 p-0.5" />
        <input type="text" value={value} onChange={handleHexChange} maxLength={7}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          placeholder="#1A4FA0" />
        <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-200" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

// ── Phone Mockup ───────────────────────────────────────────────────────────
function PhoneMockup({ form }) {
  const primary = form.primaryColor || "#1A4FA0";
  const accent  = form.accentColor  || "#2E7FD9";
  const appName = form.appName      || "EduMaster";
  const tagline = form.tagline      || "Learn. Grow. Succeed.";

  const quickActions = [
    { icon: "📚", label: "My Courses" },
    { icon: "📝", label: "Mock Tests" },
    { icon: "🎥", label: "Recordings" },
    { icon: "👥", label: "Batches" },
  ];

  return (
    <div className="flex justify-center">
      <div className="relative flex w-[260px] flex-col overflow-hidden rounded-[2.2rem] border-[5px] border-slate-800 bg-[#F8FAFC] shadow-2xl" style={{ minHeight: 520 }}>
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-20 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-slate-800" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pb-1 pt-5 text-[9px] text-white" style={{ backgroundColor: primary }}>
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1"><span>●●●</span><span>WiFi</span><span>🔋</span></div>
        </div>

        {/* Hero */}
        <div className="relative px-3 pb-3 pt-2" style={{ backgroundColor: primary }}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="logo" className="h-5 w-5 rounded object-cover" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold text-white" style={{ backgroundColor: accent }}>
                  {appName[0]}
                </div>
              )}
              <div>
                <p className="text-[8px] font-bold text-white leading-tight">{appName}</p>
                <p className="text-[7px] text-white/60 leading-tight">{tagline}</p>
              </div>
            </div>
            <div className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white/30" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>A</div>
          </div>

          <p className="text-[9px] text-white/70 mb-0.5">Good morning 👋</p>
          <p className="text-[12px] font-extrabold text-white mb-2 leading-tight">Learner</p>

          <div className="flex gap-1.5">
            {[{ label: "Enrolled", value: "3" }, { label: "Completed", value: "1" }, { label: "In Progress", value: "2" }].map(({ label, value }) => (
              <div key={label} className="flex-1 rounded-xl p-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <p className="text-[13px] font-black text-white leading-tight">{value}</p>
                <p className="text-[7px] text-white/70 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Quick Access</p>
          <div className="grid grid-cols-4 gap-1">
            {quickActions.map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: hex(primary, 0.08) }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                </div>
                <p className="text-[6.5px] font-semibold text-slate-600 text-center leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="px-3 pt-2 pb-16 flex-1">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Continue Learning</p>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="h-10 w-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: hex(primary, 0.15), color: primary }}>Mathematics</div>
            <div className="p-2">
              <p className="text-[8px] font-bold text-slate-700 leading-tight mb-1">Intro to Mathematics</p>
              <div className="flex items-center gap-1 mb-1">
                <div className="flex-1 h-1 rounded-full bg-slate-100">
                  <div className="h-1 rounded-full w-[45%]" style={{ backgroundColor: accent }} />
                </div>
                <span className="text-[6.5px] font-bold" style={{ color: accent }}>45%</span>
              </div>
              <div className="w-full rounded-lg py-1 text-center text-[7px] font-bold text-white" style={{ backgroundColor: primary }}>Continue →</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-slate-200 bg-white py-1.5 px-1">
          {[["🏠", "Home"], ["📚", "Courses"], ["📝", "Tests"], ["⋯", "More"]].map(([icon, label], i) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span style={{ fontSize: 11 }}>{icon}</span>
              <span className="text-[7px] font-semibold" style={{ color: i === 0 ? primary : "#94A3B8" }}>{label}</span>
              {i === 0 && <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: primary }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Distribution card ──────────────────────────────────────────────────────
function DownloadCard({ icon, title, subtitle, url, badge, badgeColor }) {
  if (!url) return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">{icon}</div>
      <div>
        <p className="font-semibold text-slate-500">{title}</p>
        <p className="text-sm text-slate-400">{subtitle} — <span className="italic">not configured</span></p>
      </div>
    </div>
  );

  const linkLabel =
    title === "Android APK" ? "Download APK" :
    title === "iOS Simulator" ? "Download .tar.gz" :
    title === "iOS TestFlight" ? "Open TestFlight" :
    "View on Expo";
  const linkProps =
    title === "Android APK" ? { download: "EduMaster.apk" } :
    title === "iOS Simulator" ? { download: "EduMaster-iOS-Simulator.tar.gz" } :
    { target: "_blank", rel: "noopener noreferrer" };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-2xl">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-brand-ink">{title}</p>
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeColor}`}>{badge}</span>
          )}
        </div>
        <p className="truncate text-sm text-slate-500">{subtitle}</p>
        <a
          href={url}
          {...linkProps}
          className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {linkLabel}
        </a>
      </div>
      <QRCode url={url} size={80} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminAppConfigPage() {
  const [form, setForm]       = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState("branding"); // "branding" | "distribution"

  useEffect(() => {
    api.get("/app-config")
      .then((res) => setForm({ ...defaultConfig, ...res.data }))
      .catch(() => toast.error("Failed to load app config"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await api.put("/app-config", form);
      toast.success("App config saved!");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Mobile App Config</h1>
          <p className="mt-1 text-sm text-slate-500">Manage branding, colors, and app distribution links.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: "branding", label: "🎨 Branding" },
          { key: "distribution", label: "📦 App Distribution" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === key
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-slate-500 hover:text-brand-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── BRANDING TAB ── */}
      {tab === "branding" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
            <h2 className="text-base font-semibold text-brand-ink">Branding Settings</h2>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink">App Name</label>
              <input type="text" value={form.appName} onChange={(e) => set("appName", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="EduMaster" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink">Tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => set("tagline", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="Learn. Grow. Succeed." />
            </div>

            <ColorField label="Primary Color"     value={form.primaryColor}  onChange={(v) => set("primaryColor", v)} />
            <ColorField label="Accent Color"      value={form.accentColor}   onChange={(v) => set("accentColor", v)} />
            <ColorField label="Splash Background" value={form.splashBgColor} onChange={(v) => set("splashBgColor", v)} />

            <ImageUploadField label="App Logo"    value={form.logoUrl}       onChange={(v) => set("logoUrl", v)}
              hint="Shown in the app header. Upload to S3 or paste a URL." />
            <ImageUploadField label="Splash Logo" value={form.splashLogoUrl} onChange={(v) => set("splashLogoUrl", v)}
              hint="Displayed on the launch screen. Upload to S3 or paste a URL." />

            <button type="submit" disabled={saving}
              className="w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : "Save Branding"}
            </button>
          </form>

          {/* Live preview */}
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-brand-ink">Live Preview</h2>
              <p className="mt-0.5 text-xs text-slate-400">Updates in real-time as you change settings.</p>
            </div>
            <PhoneMockup form={form} />

            <div>
              <h3 className="mb-3 text-sm font-semibold text-brand-ink">Splash Screen</h3>
              <div className="flex flex-col items-center justify-center rounded-2xl p-8 text-center shadow-card"
                style={{ backgroundColor: form.splashBgColor || "#1C1E2B", minHeight: 180 }}>
                {form.splashLogoUrl ? (
                  <img src={form.splashLogoUrl} alt="splash logo" className="mb-3 h-16 w-16 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                    style={{ backgroundColor: form.primaryColor || "#1A4FA0" }}>
                    {(form.appName || "E")[0]}
                  </div>
                )}
                <p className="text-xl font-black text-white">{form.appName || "EduMaster"}</p>
                <p className="mt-1 text-xs text-white/60">{form.tagline || "Learn. Grow. Succeed."}</p>
                <p className="mt-3 text-[10px] text-white/30 uppercase tracking-widest">Splash Screen</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DISTRIBUTION TAB ── */}
      {tab === "distribution" && (
        <div className="space-y-6">

        {/* ── Hero Install Banner ── */}
        {form.androidApkUrl && (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center shadow-lg sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">📱</div>
            <div className="flex-1">
              <p className="text-lg font-black text-white">{form.appName || "EduMaster"} — Android App</p>
              <p className="mt-0.5 text-sm text-green-100">
                v{form.appVersion || "1.0.0"}{form.buildNumber ? ` · Build ${form.buildNumber}` : ""} · Ready to install
              </p>
              {form.releaseNotes && (
                <p className="mt-1 text-xs text-green-200 line-clamp-1">{form.releaseNotes}</p>
              )}
            </div>
            <a
              href={form.androidApkUrl}
              download="EduMaster.apk"
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-green-700 shadow-md transition hover:bg-green-50 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 16l-4-4h3V4h2v8h3l-4 4zM4 18h16v2H4v-2z" />
              </svg>
              Install App (.apk)
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-5">
          {/* Form */}
          <div className="space-y-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card xl:col-span-3">
            <div>
              <h2 className="text-base font-semibold text-brand-ink">App Distribution Links</h2>
              <p className="mt-1 text-sm text-slate-500">
                Paste download links here after building with EAS. Learners will see these links in the app store section.
              </p>
            </div>

            {/* Version info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-ink">App Version</label>
                <input type="text" value={form.appVersion} onChange={(e) => set("appVersion", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="1.0.0" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-ink">Build Number</label>
                <input type="text" value={form.buildNumber} onChange={(e) => set("buildNumber", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="e.g. 42" />
              </div>
            </div>

            {/* Android APK */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-brand-ink">
                <span className="text-base">🤖</span> Android APK Download URL
              </label>
              <input type="url" value={form.androidApkUrl} onChange={(e) => set("androidApkUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="https://expo.dev/artifacts/eas/..." />
              <p className="mt-1 text-xs text-slate-400">
                After running <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">eas build --platform android --profile preview</code>, copy the APK URL from <a href="https://expo.dev" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">expo.dev</a> and paste it here.
              </p>
            </div>


            {/* Expo project */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-brand-ink">
                <span className="text-base">⚡</span> Expo Project URL
              </label>
              <input type="url" value={form.expoProjectUrl} onChange={(e) => set("expoProjectUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="https://expo.dev/accounts/vedicmeet01/projects/edumaster-mobile" />
            </div>

            {/* Release notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-ink">Release Notes</label>
              <textarea value={form.releaseNotes} onChange={(e) => set("releaseNotes", e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="What's new in this version…" />
            </div>

            <button onClick={handleSubmit} disabled={saving}
              className="w-full rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : "Save Distribution Links"}
            </button>
          </div>

          {/* Preview panel */}
          <div className="space-y-4 xl:col-span-2">
            <h2 className="text-base font-semibold text-brand-ink">Download Cards Preview</h2>
            <p className="text-xs text-slate-400">How learners will see the download options.</p>

            {/* Version badge */}
            {(form.appVersion || form.buildNumber) && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <span className="text-xl">📱</span>
                <div>
                  <p className="font-semibold text-brand-ink">{form.appName || "EduMaster"}</p>
                  <div className="flex gap-2 mt-0.5">
                    {form.appVersion && <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-bold text-brand-primary">v{form.appVersion}</span>}
                    {form.buildNumber && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Build {form.buildNumber}</span>}
                  </div>
                </div>
              </div>
            )}

            <DownloadCard
              icon="🤖"
              title="Android APK"
              subtitle="Direct install on Android"
              url={form.androidApkUrl}
              badge="APK"
              badgeColor="bg-green-100 text-green-700"
            />

            <DownloadCard
              icon="⚡"
              title="Expo Project"
              subtitle="Build history & OTA updates"
              url={form.expoProjectUrl}
              badge="Expo"
              badgeColor="bg-slate-100 text-slate-600"
            />

            {form.releaseNotes && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <p className="mb-2 text-sm font-semibold text-brand-ink">📋 What's New</p>
                <p className="whitespace-pre-line text-sm text-slate-600">{form.releaseNotes}</p>
              </div>
            )}

            {/* Build instructions */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="mb-2 text-sm font-semibold text-amber-800">🔨 How to build</p>
              <div className="space-y-1.5 text-xs text-amber-700">
                <p>1. Open terminal in <code className="rounded bg-amber-100 px-1 font-mono">MobileApp/</code></p>
                <p>2. <code className="rounded bg-amber-100 px-1 font-mono">eas build --platform android --profile preview</code></p>
                <p>3. Wait ~10 min for cloud build to finish</p>
                <p>4. Copy APK URL from <a href="https://expo.dev/accounts/vedicmeet01/projects/edumaster-mobile" target="_blank" rel="noopener noreferrer" className="font-semibold underline">expo.dev dashboard</a></p>
                <p>5. Paste URL in the Android APK field above</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
