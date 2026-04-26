import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import {
  formatDate,
  formatFileSize,
  getFullFileUrl,
  getLiveTestStatus
} from "../../utils/helpers";

const badgeClassNames = {
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  slate: "bg-slate-100 text-slate-600"
};

const CourseViewerPage = () => {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const { data: enrollments, loading, refresh } = useFetch(() => api.get("/enrollments/mine"), []);
  const [activeIndex, setActiveIndex] = useState(0);

  const enrollment = useMemo(
    () => enrollments.find((item) => item._id === enrollmentId),
    [enrollments, enrollmentId]
  );

  if (loading) return <Loader label="Loading course..." />;
  if (!enrollment) return <div className="rounded-[28px] bg-white p-10 shadow-panel">Course not found.</div>;

  const pages = enrollment.course?.pages || [];
  const notes = enrollment.course?.notes || [];
  const noteFiles = enrollment.course?.noteFiles || [];
  const liveTest = enrollment.course?.liveTest || {};
  const liveTestStatus = getLiveTestStatus(liveTest);
  const activePage = pages[activeIndex];

  const markComplete = async () => {
    try {
      await api.put(`/enrollments/${enrollment._id}/progress`, { completedPageIndex: activeIndex });
      toast.success("Progress updated");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update progress");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <aside className="rounded-[28px] bg-white p-5 shadow-panel">
        <button className="mb-4 rounded-2xl border px-4 py-3 text-sm" onClick={() => navigate("/learner")}>
          Back to My Courses
        </button>
        <h2 className="font-display text-2xl">{enrollment.course?.title}</h2>
        <p className="mt-2 text-sm text-slate-500">{enrollment.progress}% complete</p>
        <div className="mt-5 space-y-2">
          {pages.map((page, index) => (
            <button
              key={`${page.title}-${index}`}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm ${
                activeIndex === index ? "bg-teal-700 text-white" : "bg-slate-50 text-slate-600"
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {index + 1}. {page.title}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <div className="rounded-3xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Live Test</p>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  badgeClassNames[liveTestStatus.tone]
                }`}
              >
                {liveTestStatus.label}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {liveTest.title || "Your instructor can publish an active live test for this course here."}
            </p>
            {liveTest.startsAt ? (
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                Starts {formatDate(liveTest.startsAt)}
              </p>
            ) : null}
            {liveTestStatus.canJoin ? (
              <a
                href={liveTest.link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
              >
                Open Live Test
              </a>
            ) : null}
          </div>

          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Class Notes</p>
            <p className="mt-3 text-sm text-slate-500">
              {notes.length || noteFiles.length
                ? `${notes.length} text note${notes.length === 1 ? "" : "s"} and ${noteFiles.length} PDF file${noteFiles.length === 1 ? "" : "s"} shared for this course.`
                : "No class notes have been shared yet."}
            </p>
          </div>
        </div>
      </aside>
      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h1 className="font-display text-3xl">{activePage?.title}</h1>
          <div
            className="prose prose-slate mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: activePage?.content || "" }}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white"
              onClick={markComplete}
            >
              Mark Page as Complete
            </button>
            <button
              className="rounded-2xl border px-4 py-3 text-sm font-medium"
              onClick={() => setActiveIndex((value) => Math.min(value + 1, pages.length - 1))}
            >
              Next Chapter
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <article className="rounded-[28px] bg-white p-6 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl text-slate-900">Live Test</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Check timing, read instructions, and open the active test link here.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  badgeClassNames[liveTestStatus.tone]
                }`}
              >
                {liveTestStatus.label}
              </span>
            </div>

            {liveTest.enabled ? (
              <>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{liveTest.title}</h3>
                {liveTest.startsAt || liveTest.endsAt ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Starts</p>
                      <p className="mt-2 font-medium text-slate-900">
                        {liveTest.startsAt ? formatDate(liveTest.startsAt) : "Available now"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ends</p>
                      <p className="mt-2 font-medium text-slate-900">
                        {liveTest.endsAt ? formatDate(liveTest.endsAt) : "No closing time set"}
                      </p>
                    </div>
                  </div>
                ) : null}
                {liveTest.instructions ? (
                  <div
                    className="prose prose-slate mt-6 max-w-none"
                    dangerouslySetInnerHTML={{ __html: liveTest.instructions }}
                  />
                ) : (
                  <p className="mt-6 text-sm text-slate-500">
                    Your instructor has not added any extra instructions yet.
                  </p>
                )}
                {liveTestStatus.canJoin ? (
                  <a
                    href={liveTest.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                  >
                    Open Live Test
                  </a>
                ) : (
                  <p className="mt-6 text-sm text-slate-500">
                    The live test link will become available when the test window opens.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                No live test is active for this course right now.
              </p>
            )}
          </article>

          <article className="rounded-[28px] bg-white p-6 shadow-panel">
            <h2 className="font-display text-2xl text-slate-900">Class Notes</h2>
            <p className="mt-2 text-sm text-slate-500">
              Notes shared by your instructor stay here for quick revision and download.
            </p>

            {!notes.length && !noteFiles.length ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Notes will appear here once your instructor publishes them.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {noteFiles.map((noteFile, index) => (
                  <div
                    key={`${noteFile.path}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 p-5"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{noteFile.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {formatFileSize(noteFile.size)}
                        {noteFile.uploadedAt ? ` • Shared ${formatDate(noteFile.uploadedAt)}` : ""}
                      </p>
                    </div>
                    <a
                      href={getFullFileUrl(noteFile.path)}
                      target="_blank"
                      rel="noreferrer"
                      download={noteFile.name}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                    >
                      Download PDF
                    </a>
                  </div>
                ))}

                {notes.map((note, index) => (
                  <details
                    key={`${note.title}-${index}-${note.createdAt || index}`}
                    className="rounded-3xl border border-slate-200 p-5"
                  >
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{note.title}</p>
                          {note.createdAt ? (
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                              Shared {formatDate(note.createdAt)}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          Note {index + 1}
                        </span>
                      </div>
                    </summary>
                    <div
                      className="prose prose-slate mt-5 max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content || "" }}
                    />
                  </details>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
};

export default CourseViewerPage;
