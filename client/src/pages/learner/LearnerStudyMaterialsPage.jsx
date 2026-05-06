import { useMemo, useState } from "react";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { getFullFileUrl } from "../../utils/helpers";
import { CourseThumbnail } from "../../components/learner/LearnerPortalUI";

/* ── Icons ───────────────────────────────────────────────────────────── */
const IcPDF = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-red-500">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IcNote = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-blue-500">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IcDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IcEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

/* ── File size formatter ─────────────────────────────────────────────── */
const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024*1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024*1024)).toFixed(1)} MB`;
};

/* ── PDF File row ────────────────────────────────────────────────────── */
const FileRow = ({ file }) => {
  const url = getFullFileUrl(file.path);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-brand-primary/30 transition">
      <IcPDF />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-ink">{file.name}</p>
        {file.size > 0 && <p className="text-[11px] text-slate-400">{fmtSize(file.size)}</p>}
      </div>
      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-primary hover:text-brand-primary transition"
        >
          <IcEye />View
        </a>
        <a
          href={url}
          download={file.name}
          className="flex items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1.5 text-xs font-bold text-white hover:bg-brand-ink transition"
        >
          <IcDownload />Download
        </a>
      </div>
    </div>
  );
};

/* ── Course Material Card ────────────────────────────────────────────── */
const CourseBlock = ({ course, notes, noteFiles }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card">
      {/* Header */}
      <button
        className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200">
          <CourseThumbnail
            title={course?.title}
            thumbnail={course?.thumbnail}
            className="h-full"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-brand-ink">{course?.title || "Course"}</h3>
          <p className="text-[11px] text-slate-500">
            {noteFiles.length} PDF{noteFiles.length !== 1 ? "s" : ""} · {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {/* PDF files */}
          {noteFiles.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                PDF Materials ({noteFiles.length})
              </p>
              <div className="space-y-2">
                {noteFiles.map((f, i) => <FileRow key={i} file={f} />)}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Notes ({notes.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {notes.map((note, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-2">
                      <IcNote />
                      <div>
                        <p className="text-sm font-bold text-brand-ink">{note.title}</p>
                        {note.content && (
                          <p className="mt-1 line-clamp-3 text-xs text-slate-600">{note.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {noteFiles.length === 0 && notes.length === 0 && (
            <p className="rounded-xl bg-slate-50 py-6 text-center text-xs text-slate-400">
              No materials uploaded for this course yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────────── */
const LearnerStudyMaterialsPage = () => {
  const [search, setSearch] = useState("");
  const { data: enrollments, loading } = useFetch(() => api.get("/enrollments/mine"), []);

  const courses = useMemo(() => {
    return enrollments
      .map((e) => e.course)
      .filter(Boolean)
      .filter((c) => {
        if (!search.trim()) return true;
        return c.title?.toLowerCase().includes(search.toLowerCase());
      });
  }, [enrollments, search]);

  const totalPDFs  = enrollments.reduce((s, e) => s + (e.course?.noteFiles?.length || 0), 0);
  const totalNotes = enrollments.reduce((s, e) => s + (e.course?.notes?.length || 0), 0);

  if (loading) return <Loader label="Loading study materials…" />;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Study Materials</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalPDFs} PDF{totalPDFs !== 1 ? "s" : ""} · {totalNotes} note{totalNotes !== 1 ? "s" : ""} across {enrollments.length} course{enrollments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      {enrollments.length > 0 && (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition shadow-sm"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* ── Course blocks ── */}
      {!enrollments.length ? (
        <EmptyState
          title="No enrolled courses"
          description="Enroll in a course to see study materials here."
        />
      ) : !courses.length ? (
        <EmptyState title="No courses match your search" description="Try a different keyword." />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const enroll = enrollments.find((e) => String(e.course?._id) === String(course._id));
            return (
              <CourseBlock
                key={course._id}
                course={course}
                notes={course.notes || []}
                noteFiles={course.noteFiles || []}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearnerStudyMaterialsPage;
