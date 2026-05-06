import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import {
  formatDate,
  formatFileSize,
  getFullFileUrl,
  getLiveTestStatus,
  toDateTimeLocalValue,
} from "../../utils/helpers";

/* ── helpers ──────────────────────────────────────────────────────── */
const createPendingFileKey = (f) => `${f.name}-${f.size}-${f.lastModified}`;

const addUnique = (current, next) => {
  const seen = new Set(current.map(createPendingFileKey));
  const out = [...current];
  next.forEach((f) => {
    const k = createPendingFileKey(f);
    if (!seen.has(k)) { seen.add(k); out.push(f); }
  });
  return out;
};

const mapCourseToDraft = (course) => ({
  liveTest: {
    enabled:      Boolean(course?.liveTest?.enabled),
    title:        course?.liveTest?.title        || "",
    link:         course?.liveTest?.link         || "",
    instructions: course?.liveTest?.instructions || "",
    startsAt:     toDateTimeLocalValue(course?.liveTest?.startsAt),
    endsAt:       toDateTimeLocalValue(course?.liveTest?.endsAt),
  },
  noteFiles: (course?.noteFiles || []).map((f) => ({
    name:       f.name       || "",
    path:       f.path       || "",
    size:       f.size       || 0,
    uploadedAt: f.uploadedAt || new Date().toISOString(),
  })),
});

const BADGE = {
  amber:   "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  slate:   "bg-slate-100 text-slate-600",
};

/* ── sub-components ───────────────────────────────────────────────── */
const FileRow = ({ file, onView, onDownload, onDelete }) => (
  <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-0 hover:bg-slate-50/50 px-2 -mx-2 rounded-lg transition">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-brand-ink truncate">{file.name}</p>
      <p className="text-[11px] text-slate-400">
        {file.uploadedAt ? formatDate(file.uploadedAt) : "Pending upload"} · {formatFileSize(file.size)}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <button onClick={onView}     title="View"     className="text-slate-400 hover:text-brand-primary transition"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
      <button onClick={onDownload} title="Download" className="text-slate-400 hover:text-brand-primary transition"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button>
      <button onClick={onDelete}   title="Delete"   className="text-slate-400 hover:text-rose-500 transition"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg></button>
    </div>
  </div>
);

/* ── main component ───────────────────────────────────────────────── */
const InstructorCourseResourcesPage = () => {
  const { data: courses, setData: setCourses, loading } = useFetch(() => api.get("/courses"), []);
  const [selectedId, setSelectedId]     = useState("");
  const [draft, setDraft]               = useState(mapCourseToDraft(null));
  const [pendingFiles, setPendingFiles] = useState([]);
  const [saving, setSaving]             = useState(false);
  const [schedulingDraft, setSchedulingDraft] = useState(false);
  const dropRef = useRef(null);

  const coursesArr = Array.isArray(courses) ? courses : [];

  useEffect(() => {
    if (!coursesArr.length) { setSelectedId(""); return; }
    setSelectedId((cur) => {
      if (cur && coursesArr.some((c) => c._id === cur)) return cur;
      return coursesArr[0]._id;
    });
  }, [coursesArr]);

  const selectedCourse = useMemo(
    () => coursesArr.find((c) => c._id === selectedId) || coursesArr[0] || null,
    [coursesArr, selectedId]
  );

  useEffect(() => {
    setDraft(mapCourseToDraft(selectedCourse));
    setPendingFiles([]);
  }, [selectedCourse]);

  const setLt = (key, val) =>
    setDraft((d) => ({ ...d, liveTest: { ...d.liveTest, [key]: val } }));

  /* ── file selection & drag-drop ── */
  const handleFiles = (fileList) => {
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length !== fileList.length)
      toast.error("Only PDF files are accepted");
    if (pdfs.length) setPendingFiles((cur) => addUnique(cur, pdfs));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
    dropRef.current?.classList.remove("border-brand-primary", "bg-brand-surface");
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add("border-brand-primary", "bg-brand-surface");
  };
  const handleDragLeave = () => {
    dropRef.current?.classList.remove("border-brand-primary", "bg-brand-surface");
  };

  /* ── save ── */
  const save = async (asDraft = false) => {
    if (!selectedCourse) return;
    if (draft.liveTest.enabled) {
      if (!draft.liveTest.title.trim()) { toast.error("Test title is required"); return; }
      if (!draft.liveTest.link.trim())  { toast.error("Assessment link is required"); return; }
      if (draft.liveTest.startsAt && draft.liveTest.endsAt && new Date(draft.liveTest.endsAt) < new Date(draft.liveTest.startsAt)) {
        toast.error("End time must be after start time"); return;
      }
    }
    setSaving(true);
    if (asDraft) setSchedulingDraft(true);
    try {
      const fd = new FormData();
      fd.append("liveTest", JSON.stringify({
        ...draft.liveTest,
        enabled: asDraft ? false : draft.liveTest.enabled,
        startsAt: draft.liveTest.startsAt || null,
        endsAt:   draft.liveTest.endsAt   || null,
      }));
      fd.append("notes",         JSON.stringify([]));
      fd.append("existingNoteFiles", JSON.stringify(draft.noteFiles));
      pendingFiles.forEach((f) => fd.append("noteFiles", f));

      const { data } = await api.put(`/courses/${selectedCourse._id}/resources`, fd);
      setCourses((cur) => cur.map((c) => (c._id === data._id ? data : c)));
      setDraft(mapCourseToDraft(data));
      setPendingFiles([]);
      toast.success(asDraft ? "Saved as draft" : "Assessment scheduled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
      setSchedulingDraft(false);
    }
  };

  if (loading) return <Loader label="Loading course resources..." />;

  if (!coursesArr.length) {
    return (
      <EmptyState
        title="No assigned courses"
        description="Once a course is assigned to your account, you can manage live assessments and PDF materials here."
      />
    );
  }

  const testStatus = getLiveTestStatus(selectedCourse?.liveTest);
  const allFiles   = draft.noteFiles;

  return (
    <div className="space-y-6">
      {/* ── Header + course selector ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Course Content Management</h1>
          <p className="mt-1 text-sm text-slate-500">{selectedCourse?.title || "Select a course below"}</p>
        </div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-ink shadow-sm focus:border-brand-primary focus:outline-none"
        >
          {coursesArr.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* ── Schedule Live Assessment ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-ink">Schedule Live Assessment</h2>
            </div>
          </div>
          <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${BADGE[testStatus.tone]}`}>
            {testStatus.label}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {/* Test Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Test Title</label>
            <input
              value={draft.liveTest.title}
              onChange={(e) => setLt("title", e.target.value)}
              placeholder="e.g. Mid-Term Calculus Challenge 2024"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none"
            />
          </div>

          {/* Assessment Link */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Assessment Link</label>
            <div className="relative">
              <input
                value={draft.liveTest.link}
                onChange={(e) => setLt("link", e.target.value)}
                placeholder="https://portal.edumaster.pro/test/..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => draft.liveTest.link && window.open(draft.liveTest.link, "_blank")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-brand-primary transition"
                title="Open link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </button>
            </div>
          </div>

          {/* Starts / Ends */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Starts At</label>
              <input
                type="datetime-local"
                value={draft.liveTest.startsAt}
                onChange={(e) => setLt("startsAt", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Ends At</label>
              <input
                type="datetime-local"
                value={draft.liveTest.endsAt}
                onChange={(e) => setLt("endsAt", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-brand-ink focus:border-brand-primary focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Short Instructions */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Short Instructions</label>
            <textarea
              value={draft.liveTest.instructions}
              onChange={(e) => setLt("instructions", e.target.value)}
              rows={3}
              placeholder="Enter simple guidelines for students..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-brand-ink placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Enable toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
            <div
              onClick={() => setLt("enabled", !draft.liveTest.enabled)}
              className={`relative h-5 w-9 rounded-full transition-colors ${draft.liveTest.enabled ? "bg-brand-primary" : "bg-slate-300"}`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${draft.liveTest.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Enable Live Assessment for students</span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-ink hover:bg-slate-50 disabled:opacity-60 transition"
          >
            {schedulingDraft ? "Saving…" : "Draft"}
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-60 transition"
          >
            {saving && !schedulingDraft ? "Scheduling…" : "Schedule Test"}
          </button>
        </div>
      </div>

      {/* ── Course PDF Materials ── */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-surface text-brand-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-brand-ink">Course PDF Materials</h2>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-ink transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload PDF
            <input type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>

        {/* File list */}
        {allFiles.length || pendingFiles.length ? (
          <div className="mt-5">
            {/* Saved files */}
            {allFiles.map((f, i) => (
              <FileRow
                key={`saved-${i}`}
                file={f}
                onView={() => window.open(getFullFileUrl(f.path), "_blank")}
                onDownload={() => {
                  const a = document.createElement("a");
                  a.href = getFullFileUrl(f.path);
                  a.download = f.name;
                  a.click();
                }}
                onDelete={() =>
                  setDraft((d) => ({ ...d, noteFiles: d.noteFiles.filter((_, fi) => fi !== i) }))
                }
              />
            ))}
            {/* Pending files */}
            {pendingFiles.map((f, i) => (
              <div key={createPendingFileKey(f)} className="flex items-center gap-4 rounded-xl border border-dashed border-brand-accent bg-brand-surface py-3 px-4 mt-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-ink truncate">{f.name}</p>
                  <p className="text-[11px] text-brand-primary">{formatFileSize(f.size)} · Will upload on save</p>
                </div>
                <button
                  onClick={() => setPendingFiles((cur) => cur.filter((_, pi) => pi !== i))}
                  className="text-slate-400 hover:text-rose-500 transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}

            {/* Save materials button */}
            {pendingFiles.length > 0 && (
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="mt-4 w-full rounded-xl bg-brand-primary py-2.5 text-sm font-bold text-white hover:bg-brand-ink disabled:opacity-60 transition"
              >
                {saving ? "Uploading…" : `Upload ${pendingFiles.length} PDF${pendingFiles.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        ) : null}

        {/* Drag & drop zone */}
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-slate-400 mb-2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <p className="text-sm text-slate-500">Drag and drop more PDF files here</p>
          <label className="mt-2 cursor-pointer text-xs font-semibold text-brand-primary hover:underline">
            or browse
            <input type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default InstructorCourseResourcesPage;
