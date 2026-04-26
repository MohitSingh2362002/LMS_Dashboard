import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import RichTextEditor from "../../components/RichTextEditor";
import useFetch from "../../hooks/useFetch";
import {
  formatDate,
  formatFileSize,
  getFullFileUrl,
  getLiveTestStatus,
  toDateTimeLocalValue
} from "../../utils/helpers";

const createEmptyNote = () => ({
  title: "",
  content: "",
  createdAt: new Date().toISOString()
});

const createPendingFileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const addUniquePendingFiles = (currentFiles, nextFiles) => {
  const seen = new Set(currentFiles.map(createPendingFileKey));
  const merged = [...currentFiles];

  nextFiles.forEach((file) => {
    const key = createPendingFileKey(file);

    if (seen.has(key)) return;

    seen.add(key);
    merged.push(file);
  });

  return merged;
};

const mapCourseToDraft = (course) => ({
  notes: course?.notes?.length
    ? course.notes.map((note) => ({
        title: note.title || "",
        content: note.content || "",
        createdAt: note.createdAt || new Date().toISOString()
      }))
    : [],
  noteFiles: course?.noteFiles?.length
    ? course.noteFiles.map((noteFile) => ({
        name: noteFile.name || "",
        path: noteFile.path || "",
        size: noteFile.size || 0,
        uploadedAt: noteFile.uploadedAt || new Date().toISOString()
      }))
    : [],
  liveTest: {
    enabled: Boolean(course?.liveTest?.enabled),
    title: course?.liveTest?.title || "",
    instructions: course?.liveTest?.instructions || "",
    link: course?.liveTest?.link || "",
    startsAt: toDateTimeLocalValue(course?.liveTest?.startsAt),
    endsAt: toDateTimeLocalValue(course?.liveTest?.endsAt)
  }
});

const badgeClassNames = {
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  slate: "bg-slate-100 text-slate-600"
};

const InstructorCourseResourcesPage = () => {
  const { data: courses, setData: setCourses, loading } = useFetch(() => api.get("/courses"), []);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [draft, setDraft] = useState(() => mapCourseToDraft(null));
  const [pendingNoteFiles, setPendingNoteFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courses.length) {
      setSelectedCourseId("");
      return;
    }

    setSelectedCourseId((current) => {
      if (current && courses.some((course) => course._id === current)) return current;
      return courses[0]._id;
    });
  }, [courses]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    setDraft(mapCourseToDraft(selectedCourse));
    setPendingNoteFiles([]);
  }, [selectedCourse]);

  const updateLiveTest = (key, value) => {
    setDraft((current) => ({
      ...current,
      liveTest: { ...current.liveTest, [key]: value }
    }));
  };

  const updateNote = (index, key, value) => {
    setDraft((current) => ({
      ...current,
      notes: current.notes.map((note, noteIndex) =>
        noteIndex === index ? { ...note, [key]: value } : note
      )
    }));
  };

  const handleNoteFileSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files are allowed for note downloads");
    }

    if (pdfFiles.length) {
      setPendingNoteFiles((current) => addUniquePendingFiles(current, pdfFiles));
    }

    event.target.value = "";
  };

  const saveResources = async () => {
    if (!selectedCourse) return;

    if (draft.liveTest.enabled) {
      if (!draft.liveTest.title.trim()) {
        toast.error("Add a live test title before saving");
        return;
      }

      if (!draft.liveTest.link.trim()) {
        toast.error("Add a live test link before saving");
        return;
      }

      if (
        draft.liveTest.startsAt &&
        draft.liveTest.endsAt &&
        new Date(draft.liveTest.endsAt) < new Date(draft.liveTest.startsAt)
      ) {
        toast.error("Live test end time must be after the start time");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("notes", JSON.stringify(draft.notes));
      payload.append("existingNoteFiles", JSON.stringify(draft.noteFiles));
      payload.append(
        "liveTest",
        JSON.stringify({
          ...draft.liveTest,
          startsAt: draft.liveTest.startsAt || null,
          endsAt: draft.liveTest.endsAt || null
        })
      );
      pendingNoteFiles.forEach((file) => payload.append("noteFiles", file));

      const { data } = await api.put(`/courses/${selectedCourse._id}/resources`, payload);

      setCourses((current) =>
        current.map((course) => (course._id === data._id ? data : course))
      );
      setDraft(mapCourseToDraft(data));
      setPendingNoteFiles([]);
      toast.success("Course resources updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save course resources");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading instructor resources..." />;

  if (!courses.length) {
    return (
      <EmptyState
        title="No assigned courses yet"
        description="Once a course is assigned to your instructor account, you’ll be able to publish live tests, rich notes, and PDF notes from here."
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <aside className="rounded-[28px] bg-white p-5 shadow-panel">
        <div>
          <h2 className="font-display text-2xl text-slate-900">Your Courses</h2>
          <p className="mt-2 text-sm text-slate-500">
            Pick a course to manage its live test settings, student notes, and PDF downloads.
          </p>
        </div>
        <div className="mt-5 space-y-3">
          {courses.map((course) => {
            const testStatus = getLiveTestStatus(course.liveTest);

            return (
              <button
                key={course._id}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  selectedCourseId === course._id
                    ? "border-teal-700 bg-teal-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
                onClick={() => setSelectedCourseId(course._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{course.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                      {course.status}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      badgeClassNames[testStatus.tone]
                    }`}
                  >
                    {testStatus.label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-slate-700">{course.notes?.length || 0}</p>
                    <p className="mt-1">Text notes</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-slate-700">{course.noteFiles?.length || 0}</p>
                    <p className="mt-1">PDF files</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-slate-700">
                      {course.liveTest?.enabled ? "Enabled" : "Off"}
                    </p>
                    <p className="mt-1">Live test</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-slate-900">{selectedCourse?.title}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Publish student-facing course notes, upload note PDFs, and keep a live test ready to launch.
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                Last updated {formatDate(selectedCourse?.updatedAt)}
              </p>
            </div>
            <button
              className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
              onClick={saveResources}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl text-slate-900">Live Test</h3>
              <p className="mt-2 text-sm text-slate-500">
                Turn on a learner-facing test link with optional timing and instructions.
              </p>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={draft.liveTest.enabled}
                onChange={(event) => updateLiveTest("enabled", event.target.checked)}
              />
              Enable Live Test
            </label>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Test Title</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={draft.liveTest.title}
                onChange={(event) => updateLiveTest("title", event.target.value)}
                placeholder="Module 3 live assessment"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Test Link</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={draft.liveTest.link}
                onChange={(event) => updateLiveTest("link", event.target.value)}
                placeholder="https://forms.google.com/... or your test platform URL"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Starts At</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={draft.liveTest.startsAt}
                onChange={(event) => updateLiveTest("startsAt", event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Ends At</span>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={draft.liveTest.endsAt}
                onChange={(event) => updateLiveTest("endsAt", event.target.value)}
              />
            </label>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Instructions</span>
              <RichTextEditor
                key={`${selectedCourseId}-live-test`}
                value={draft.liveTest.instructions}
                onChange={(value) => updateLiveTest("instructions", value)}
                placeholder="Add test rules, allowed materials, timing, and submission guidance."
              />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl text-slate-900">Class Notes</h3>
              <p className="mt-2 text-sm text-slate-500">
                Share both rich-text notes and downloadable PDF notes for learners.
              </p>
            </div>
            <button
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  notes: [...current.notes, createEmptyNote()]
                }))
              }
            >
              Add Note
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">PDF Notes</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Upload PDF handouts, worksheets, or class notes. Learners will be able to download them.
                </p>
              </div>
              <label className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
                Upload PDFs
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleNoteFileSelection}
                />
              </label>
            </div>

            {!draft.noteFiles.length && !pendingNoteFiles.length ? (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="font-medium text-slate-700">No PDF notes uploaded yet</p>
                <p className="mt-2 text-sm text-slate-500">
                  Upload course note PDFs and they’ll appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {draft.noteFiles.map((noteFile, index) => (
                  <div
                    key={`${noteFile.path}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{noteFile.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {formatFileSize(noteFile.size)}{noteFile.uploadedAt ? ` • Added ${formatDate(noteFile.uploadedAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={getFullFileUrl(noteFile.path)}
                        target="_blank"
                        rel="noreferrer"
                        download={noteFile.name}
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        Download
                      </a>
                      <button
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            noteFiles: current.noteFiles.filter((_, fileIndex) => fileIndex !== index)
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {pendingNoteFiles.map((file, index) => (
                  <div
                    key={createPendingFileKey(file)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-teal-300 bg-teal-50 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-teal-700">
                        {formatFileSize(file.size)} • Will upload on save
                      </p>
                    </div>
                    <button
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                      onClick={() =>
                        setPendingNoteFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index)
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!draft.notes.length ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="font-medium text-slate-700">No text notes published yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Add your first note to share class takeaways, homework, or reference material.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {draft.notes.map((note, index) => (
                <div
                  key={`${selectedCourseId}-note-${index}-${note.createdAt}`}
                  className="rounded-3xl border border-slate-200 p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Note {index + 1}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        Added {formatDate(note.createdAt)}
                      </p>
                    </div>
                    <button
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          notes: current.notes.filter((_, noteIndex) => noteIndex !== index)
                        }))
                      }
                    >
                      Delete
                    </button>
                  </div>

                  <input
                    className="mb-4 w-full rounded-2xl border border-slate-200 px-4 py-3"
                    value={note.title}
                    onChange={(event) => updateNote(index, "title", event.target.value)}
                    placeholder="Class summary, homework, reference sheet..."
                  />

                  <RichTextEditor
                    key={`${selectedCourseId}-note-editor-${index}-${note.createdAt}`}
                    value={note.content}
                    onChange={(value) => updateNote(index, "content", value)}
                    placeholder="Write the class note that learners should see."
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InstructorCourseResourcesPage;
