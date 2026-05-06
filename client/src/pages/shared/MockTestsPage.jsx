import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate, getFullImageUrl } from "../../utils/helpers";

const emptyForm = {
  title: "",
  examPattern: "NEET",
  course: "",
  batch: "",
  questions: [],
  durationMinutes: 180,
  status: "draft",
  startsAt: "",
  endsAt: ""
};

const STATUS_BADGE = {
  published: "bg-emerald-500 text-white",
  draft: "bg-amber-500 text-white",
  archived: "bg-slate-400 text-white",
  scheduled: "bg-blue-500 text-white"
};

const TAG_PILL = {
  NEET: "bg-amber-100 text-amber-700",
  Olympiad: "bg-violet-100 text-violet-700",
  Foundation: "bg-brand-surface text-brand-primary",
  default: "bg-slate-100 text-slate-600"
};

// ── Edit modal ──────────────────────────────────────────────────────
const EditModal = ({ test, batches, courses, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: test.title || "",
    examPattern: test.examPattern || "NEET",
    status: test.status || "draft",
    durationMinutes: test.durationMinutes || 180,
    batch: test.batch?._id || test.batch || "",
    course: test.course?._id || test.course || "",
    startsAt: test.startsAt ? new Date(test.startsAt).toISOString().slice(0, 16) : "",
    endsAt: test.endsAt ? new Date(test.endsAt).toISOString().slice(0, 16) : ""
  });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/exam/tests/${test._id}`, {
        ...form,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined
      });
      toast.success("Test updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
        <h3 className="text-lg font-bold text-brand-ink">Edit Test Details</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">Test Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-brand-accent focus:bg-white focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Exam Category</label>
              <select value={form.examPattern} onChange={(e) => setForm({ ...form, examPattern: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="NEET">NEET</option>
                <option value="Olympiad">Olympiad</option>
                <option value="Foundation">Foundation</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">Duration (Minutes)</label>
            <input type="number" min="1" value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-brand-ink">Batch Restriction</label>
            <select value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          {(form.status === "scheduled" || form.startsAt) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Starts At</label>
                <input type="datetime-local" value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Ends At</label>
                <input type="datetime-local" value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              </div>
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="submit" className="flex-1 rounded-lg bg-brand-primary py-2.5 text-sm font-bold text-white hover:brightness-95">Save Changes</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
};

// ── Results modal ───────────────────────────────────────────────────
const ResultsModal = ({ test, onClose }) => {
  const { data: leaderboard, loading } = useFetch(() => api.get(`/exam/tests/${test._id}/leaderboard`), [test._id]);

  const rows = Array.isArray(leaderboard) ? leaderboard : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-brand-ink">Test Results</h3>
            <p className="text-xs text-slate-500">{test.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-6">
          {loading ? (
            <p className="text-center text-sm text-slate-500">Loading results…</p>
          ) : !rows.length ? (
            <p className="text-center text-sm text-slate-500">No attempts yet for this test.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 text-left">Rank</th>
                  <th className="pb-2 text-left">Student</th>
                  <th className="pb-2 text-right">Score</th>
                  <th className="pb-2 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-xs font-bold text-slate-600">#{i + 1}</td>
                    <td className="py-2.5">
                      <p className="font-semibold text-brand-ink">{r.learner?.name || "—"}</p>
                      <p className="text-[11px] text-slate-500">{r.learner?.email || ""}</p>
                    </td>
                    <td className="py-2.5 text-right font-bold text-brand-primary">{r.totalMarks ?? "—"}</td>
                    <td className="py-2.5 text-right text-xs text-slate-600">{r.accuracy != null ? `${r.accuracy.toFixed(1)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const MockTestsPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [questionSearch, setQuestionSearch] = useState("");
  const [editingTest, setEditingTest] = useState(null);
  const [resultsTest, setResultsTest] = useState(null);

  const { data: tests, loading: loadingTests, refresh } = useFetch(() => api.get("/exam/tests"), []);
  const { data: questions, loading: loadingQuestions } = useFetch(() => api.get("/exam/questions"), []);
  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);

  const filteredQuestions = useMemo(
    () => questions.filter((q) =>
      `${q.question} ${q.subject} ${q.chapter} ${q.topic}`.toLowerCase().includes(questionSearch.toLowerCase())
    ),
    [questions, questionSearch]
  );

  const counts = useMemo(() => {
    const arr = Array.isArray(tests) ? tests : [];
    return {
      total: arr.length,
      drafts: arr.filter((t) => t.status === "draft").length,
      scheduled: arr.filter((t) => t.status === "scheduled").length
    };
  }, [tests]);

  const toggleQuestion = (id) => {
    const exists = form.questions.includes(id);
    setForm({
      ...form,
      questions: exists ? form.questions.filter((x) => x !== id) : [...form.questions, id]
    });
  };

  const createTest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
        batch: form.batch || undefined,
        course: form.course || undefined
      };
      await api.post("/exam/tests", payload);
      toast.success("Mock test created");
      setForm(emptyForm);
      setQuestionSearch("");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create test");
    }
  };

  if (loadingTests || loadingQuestions || loadingCourses || loadingBatches) {
    return <Loader label="Loading mock tests..." />;
  }

  const testsList = Array.isArray(tests) ? tests : [];

  return (
    <div className="space-y-6">
      {/* Modals */}
      {editingTest ? (
        <EditModal
          test={editingTest}
          batches={batches}
          courses={courses}
          onClose={() => setEditingTest(null)}
          onSaved={refresh}
        />
      ) : null}
      {resultsTest ? (
        <ResultsModal test={resultsTest} onClose={() => setResultsTest(null)} />
      ) : null}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Assessment Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">Create, manage, and schedule mock tests for all academic tiers.</p>
        </div>
        {/* Stat chips in header */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2 shadow-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-primary"><path d="M9 11l3 3 8-8M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-2" /></svg>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Tests</p>
              <p className="text-lg font-bold text-brand-ink">{counts.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2 shadow-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-amber-500"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Drafts</p>
              <p className="text-lg font-bold text-brand-ink">{counts.drafts}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-4 py-2 shadow-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-blue-500"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Scheduled</p>
              <p className="text-lg font-bold text-brand-ink">{counts.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px,1fr]">
        {/* Create form */}
        <form onSubmit={createTest} className="h-fit rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-cta/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="#F0A500" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <h3 className="text-base font-bold text-brand-ink">Create Mock Test</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Test Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                placeholder="e.g. NEET 2024 Advanced Mock 01"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Exam Category</label>
                <select value={form.examPattern} onChange={(e) => setForm({ ...form, examPattern: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="NEET">NEET</option>
                  <option value="Olympiad">Olympiad</option>
                  <option value="Foundation">Foundation</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Duration (Min)</label>
                <input type="number" min="1" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Batch Restriction</label>
                <select value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="">All Batches</option>
                  {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            {(form.status === "scheduled") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-ink">Starts At</label>
                  <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-ink">Ends At</label>
                  <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Select Questions from Bank</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input value={questionSearch} onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Search question or topic..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm" />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-100">
              {filteredQuestions.slice(0, 20).map((q) => {
                const checked = form.questions.includes(q._id);
                return (
                  <label key={q._id} className="flex cursor-pointer items-start gap-3 border-b border-slate-50 px-3 py-2.5 last:border-0 hover:bg-slate-50">
                    <input type="checkbox" checked={checked} onChange={() => toggleQuestion(q._id)}
                      className="mt-0.5 rounded border-slate-300 text-brand-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-brand-ink">{q.question}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{[q.subject, q.chapter, q.topic].filter(Boolean).join(" · ")}</p>
                    </div>
                  </label>
                );
              })}
              {!filteredQuestions.length ? <p className="px-3 py-3 text-xs text-slate-500">No questions match.</p> : null}
            </div>
          </div>

          <button type="submit"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cta px-4 py-3 text-sm font-bold text-white hover:brightness-95">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
            Create Test
            {form.questions.length > 0 ? <span className="ml-1 rounded-md bg-white/20 px-1.5 py-0.5 text-xs">({form.questions.length}Q)</span> : null}
          </button>
        </form>

        {/* Active assessments */}
        <section>
          <h3 className="mb-4 text-base font-bold text-brand-ink">Active Assessments</h3>
          {!testsList.length ? (
            <EmptyState title="No tests yet" description="Create a mock test from your question bank." />
          ) : (
            <div className="space-y-3">
              {testsList.map((test) => {
                const badgeClass = STATUS_BADGE[test.status] || STATUS_BADGE.draft;
                const tagClass = TAG_PILL[test.examPattern] || TAG_PILL.default;
                return (
                  <div key={test._id} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition-all hover:shadow-cardHover">
                    {/* Thumbnail */}
                    <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-accent to-brand-primary">
                      {test.thumbnail ? (
                        <img src={getFullImageUrl(test.thumbnail)} alt={test.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="h-8 w-8 opacity-70"><path d="M9 11l3 3 8-8M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-2" /></svg>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${tagClass}`}>{test.examPattern}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}>{test.status}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-bold text-brand-ink">{test.title}</p>
                        <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-500">
                          <span>
                            <span className="font-semibold text-brand-ink">{test.questions?.length ?? "—"}</span> Qs
                          </span>
                          <span>
                            <span className="font-semibold text-brand-ink">{test.attemptCount ?? 0}</span> Attempts
                          </span>
                          {test.startsAt ? (
                            <span>
                              <span className="font-semibold text-brand-ink">Starts:</span> {formatDate(test.startsAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 text-right">
                        <button
                          onClick={() => setResultsTest(test)}
                          className="rounded-md bg-brand-primary px-3 py-1 text-[11px] font-semibold text-white hover:brightness-110">
                          View Results
                        </button>
                        <button
                          onClick={() => setEditingTest(test)}
                          className="rounded-md border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                          Edit Details
                        </button>
                        <p className="text-[10px] text-slate-400">Updated {formatDate(test.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MockTestsPage;
