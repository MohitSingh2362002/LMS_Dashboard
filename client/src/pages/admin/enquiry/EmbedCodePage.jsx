import { useState } from "react";
import toast from "react-hot-toast";

// Always show the live production endpoint in the embed snippet —
// external websites must call the deployed server, not localhost.
const PRODUCTION_ENDPOINT = import.meta.env.FORM_LEAD || "http://localhost:7001/api/leads/public";

// What's shown in the dark info box (reflects current env)
const API_BASE = import.meta.env.VITE_API_URL || "https://lms-dashboard-31k0.onrender.com/api";
const ENDPOINT = `${API_BASE}/leads/public`;

const SNIPPET = `<script>
(function () {
  var ENDPOINT = "${PRODUCTION_ENDPOINT}";

  document.addEventListener("submit", function (e) {
    var form = e.target;

    // DO NOT call e.preventDefault() — let the form submit normally.
    // We silently mirror the data to the LMS in the background.

    // Collect ALL form fields — no assumptions about field names
    var data = {};
    var elements = form.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.name || el.type === "submit" || el.type === "button" || el.type === "reset") continue;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
      data[el.name] = el.value;
    }

    // Tag automatically — no manual work needed
    data.source = "web-form";
    data._page  = window.location.href;

    // Fire-and-forget — does not block or interfere with the form
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(function () { /* silent — never breaks the page */ });
  });
})();
<\/script>`;

function CopyBlock({ label, code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <button
          onClick={copy}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${copied ? "bg-green-600 text-white" : "bg-brand-primary text-white hover:bg-brand-primary/90"
            }`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-5 text-xs text-slate-700 overflow-x-auto max-h-72 bg-slate-50 leading-relaxed font-mono whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

export default function EmbedCodePage() {
  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Embed Enquiry Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste <strong>one script</strong> on your website. Every form submission is automatically captured as a lead — no changes to your existing forms needed.
        </p>
      </div>

      {/* Endpoint */}
      <div className="bg-slate-900 rounded-2xl p-5 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Live API Endpoint (used in the script)</p>
          <code className="text-green-400 text-sm break-all select-all">{PRODUCTION_ENDPOINT}</code>
          <p className="text-xs text-slate-500 mt-1.5">POST · JSON · No auth · Accepts any field names · CORS open to all origins</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Your Current Server</p>
          <code className="text-cyan-400 text-sm break-all">{ENDPOINT}</code>
        </div>
      </div>

      {/* Steps — only ONE step now */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="h-9 w-9 shrink-0 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">1</div>
          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">Paste the script — that's it</p>
            <p className="text-sm text-slate-500">
              Copy the script below and paste it once, just before the <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">&lt;/body&gt;</code> tag on any page of your website. No other changes required.
            </p>
            <p className="text-xs text-slate-400 mt-2">Works on WordPress, Wix, Webflow, custom HTML, React, or any website.</p>
          </div>
        </div>
      </div>

      {/* Script */}
      <CopyBlock label="Paste this script before </body> on your website" code={SNIPPET} />

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-blue-800">How it works</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-400">✦</span>
            <span>The script listens for any form submission on your page.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-400">✦</span>
            <span>It captures <strong>every field</strong> — whatever they are named — and sends them to the API in the background.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-400">✦</span>
            <span>The lead appears instantly in <strong>All Leads → New</strong>. Raw field values are visible inside the lead detail panel.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-400">✦</span>
            <span>Your existing form behaviour (redirect, success message, etc.) is <strong>not affected</strong> — the script runs silently in the background.</span>
          </li>
        </ul>
      </div>

      {/* Example */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
        <h3 className="text-sm font-bold text-slate-700">Example — any form works as-is</h3>
        <pre className="text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap">{`<!-- No changes needed to your existing form -->
<form action="/your-existing-handler" method="post">
  <input name="student_name"   placeholder="Full Name" />
  <input name="contact_number" placeholder="Phone"     />
  <input name="email_id"       placeholder="Email"     />
  <input name="which_course"   placeholder="Course"    />
  <button type="submit">Enquire Now</button>
</form>

<!-- Just paste the script above — done! -->
<script src="...your-script..."></script>`}</pre>
      </div>
    </div>
  );
}
