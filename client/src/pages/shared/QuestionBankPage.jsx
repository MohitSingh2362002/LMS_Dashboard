import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const emptyQuestion = {
  question: "", type: "single", exam: "NEET", subject: "", chapter: "", topic: "",
  difficulty: "medium", marks: 4, negativeMarks: 1,
  options: [
    { label: "A", text: "" }, { label: "B", text: "" },
    { label: "C", text: "" }, { label: "D", text: "" }
  ],
  correctOptions: [], correctNumericAnswer: "", writtenAnswer: "", explanation: ""
};

const StatTile = ({ label, value, icon, accent }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-brand-ink">{value}</p>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
    </div>
  </div>
);

const SUBJECT_PILL = {
  mathematics: "bg-emerald-100 text-emerald-700",
  physics: "bg-blue-100 text-blue-700",
  chemistry: "bg-amber-100 text-amber-700",
  biology: "bg-pink-100 text-pink-700",
  default: "bg-slate-100 text-slate-700"
};

// ── Preview Modal ──────────────────────────────────────────────────
const PreviewModal = ({ question, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-bold uppercase text-brand-primary">{question.subject}</span>
          {question.chapter ? <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{question.chapter}</span> : null}
          {question.topic ? <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{question.topic}</span> : null}
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${question.difficulty === "easy" ? "bg-emerald-100 text-emerald-700" : question.difficulty === "hard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{question.difficulty}</span>
        </div>
        <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <p className="mt-4 text-sm font-semibold text-brand-ink leading-relaxed">{question.question}</p>
      {question.options?.length > 0 && (
        <div className="mt-4 space-y-2">
          {question.options.map((opt) => {
            const isCorrect = (question.correctOptions || []).includes(opt.label);
            return (
              <div key={opt.label} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold ${isCorrect ? "bg-emerald-500 text-white" : "bg-white text-brand-primary"}`}>{opt.label}</span>
                <span className={isCorrect ? "font-semibold text-emerald-800" : "text-brand-ink"}>{opt.text}</span>
              </div>
            );
          })}
        </div>
      )}
      {question.explanation ? (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          <span className="font-bold">Explanation: </span>{question.explanation}
        </div>
      ) : null}
      <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
        <span>Marks: <span className="font-bold text-brand-ink">{question.marks ?? 4}</span></span>
        <span>Negative: <span className="font-bold text-rose-600">-{question.negativeMarks ?? 1}</span></span>
        <span className="ml-auto">Exam: <span className="font-bold text-brand-ink">{question.exam || "NEET"}</span></span>
      </div>
    </div>
  </div>
);

const QuestionBankPage = () => {
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [filters, setFilters] = useState({ exam: "", subject: "", difficulty: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => Boolean(v))).toString();
  const { data: questions, loading, refresh } = useFetch(
    () => api.get(query ? `/exam/questions?${query}` : "/exam/questions"),
    [query]
  );

  const subjects = useMemo(() => [...new Set(questions.map((i) => i.subject).filter(Boolean))], [questions]);
  const filtered = useMemo(
    () => questions.filter((q) => !search || q.question?.toLowerCase().includes(search.toLowerCase())),
    [questions, search]
  );

  // Reset to page 1 whenever filters or search change
  useEffect(() => { setPage(1); }, [search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = useMemo(() => ({
    total: questions.length,
    recent: questions.filter((q) => {
      const t = new Date(q.createdAt || q.updatedAt).getTime();
      return Date.now() - t < 7 * 24 * 60 * 60 * 1000;
    }).length,
    flagged: questions.filter((q) => q.flagged || q.needsReview).length
  }), [questions]);

  const updateOption = (i, text) => {
    const opts = [...form.options];
    opts[i] = { ...opts[i], text };
    setForm({ ...form, options: opts });
  };

  const toggleAnswer = (label) => {
    const exists = form.correctOptions.includes(label);
    setForm({
      ...form,
      correctOptions: exists
        ? form.correctOptions.filter((x) => x !== label)
        : form.type === "single" || form.type === "assertion-reason"
          ? [label]
          : [...form.correctOptions, label]
    });
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/exam/questions/${editingId}`, form);
        toast.success("Question updated");
        setShowEditModal(false);
      } else {
        await api.post("/exam/questions", form);
        toast.success("Question added");
      }
      setForm(emptyQuestion); setEditingId(""); refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
  };

  const startEdit = (q) => {
    setEditingId(q._id);
    setForm({
      ...emptyQuestion, ...q,
      options: q.options?.length ? q.options : emptyQuestion.options,
      correctOptions: q.correctOptions || []
    });
    setShowEditModal(true);
  };

  const importQuestions = async () => {
    try {
      const { data } = await api.post("/exam/questions/bulk", { text: bulkText });
      toast.success(`${data.count} questions imported`);
      setBulkText(""); setShowBulk(false); refresh();
    } catch (err) { toast.error(err.response?.data?.message || "Import failed"); }
  };

  if (loading) return <Loader label="Loading question bank..." />;

  return (
    <div className="space-y-6">
      {previewQuestion ? <PreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} /> : null}

      {/* Edit question modal */}
      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingId(""); setForm(emptyQuestion); }}>
          <form onSubmit={submitQuestion} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-ink">Edit Question</h3>
              <button type="button" onClick={() => { setShowEditModal(false); setEditingId(""); setForm(emptyQuestion); }}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Question Prompt</label>
                <textarea rows="3" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-accent focus:bg-white focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-ink">Subject</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-ink">Chapter</label>
                  <input value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Difficulty</label>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  {["easy", "medium", "hard"].map((d) => (
                    <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                      className={`flex-1 rounded-md py-1 text-[10px] font-bold uppercase transition ${form.difficulty === d ? "bg-white text-brand-primary shadow-sm" : "text-slate-500"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Options &amp; Correct Answer</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => {
                    const checked = form.correctOptions.includes(opt.label);
                    return (
                      <div key={opt.label} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white text-xs font-bold text-brand-primary">{opt.label}</span>
                        <input value={opt.text} onChange={(e) => { const opts = [...form.options]; opts[i] = { ...opts[i], text: e.target.value }; setForm({ ...form, options: opts }); }}
                          className="flex-1 bg-transparent text-sm focus:outline-none" />
                        <button type="button" onClick={() => {
                          const exists = form.correctOptions.includes(opt.label);
                          setForm({ ...form, correctOptions: exists ? form.correctOptions.filter((x) => x !== opt.label) : form.type === "single" ? [opt.label] : [...form.correctOptions, opt.label] });
                        }} className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${checked ? "border-brand-accent bg-brand-accent" : "border-slate-300 bg-white"}`}>
                          {checked ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3"><path d="M5 13l4 4L19 7" /></svg> : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              {form.explanation !== undefined ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-brand-ink">Explanation</label>
                  <textarea rows="2" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-accent focus:bg-white focus:outline-none" />
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-brand-cta py-2.5 text-sm font-semibold text-white hover:brightness-95">Save Changes</button>
              <button type="button" onClick={() => setPreviewQuestion(form)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-slate-50">Preview</button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Category manager modal */}
      {showCategoryModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-ink">Manage Subject Categories</h3>
              <button onClick={() => setShowCategoryModal(false)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Subjects are derived from existing questions. To add a new category, create a question with that subject.</p>

            {/* Existing subjects */}
            <div className="mt-4 space-y-1 max-h-48 overflow-y-auto">
              {subjects.length ? subjects.map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-brand-ink">{s}</span>
                  <span className="text-[10px] text-slate-400">
                    {questions.filter((q) => q.subject === s).length} questions
                  </span>
                </div>
              )) : (
                <p className="text-xs text-slate-400 py-2">No subjects yet. Create your first question to add a category.</p>
              )}
            </div>

            {/* Quick-add: set subject on form and close */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Quick-start new category</label>
              <div className="flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategory.trim()) {
                      setForm((f) => ({ ...f, subject: newCategory.trim() }));
                      setNewCategory("");
                      setShowCategoryModal(false);
                      toast.success(`Subject "${newCategory.trim()}" set — add a question to create the category`);
                    }
                  }}
                  className="rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white hover:brightness-95">
                  Use
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* Header */}
      <div>
        <p className="text-xs text-slate-500">LMS Portal / Course Catalog / <span className="font-semibold text-brand-ink">Question Bank</span></p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">Question Command Center</h1>
            <p className="mt-1 text-sm text-slate-500">Manage, organize, and create assessment materials for all academic tiers.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBulk((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-brand-ink px-3 py-2 text-sm font-semibold text-white hover:bg-black">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              Bulk Import CSV
            </button>
            <button onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white hover:brightness-95">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
              New Category
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total Questions" value={counts.total.toLocaleString()} accent="bg-brand-surface text-brand-primary"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>} />
        <StatTile label="Recent" value={counts.recent} accent="bg-blue-100 text-blue-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>} />
        <StatTile label="Flagged" value={counts.flagged} accent="bg-rose-100 text-rose-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15" /></svg>} />
      </div>

      {/* Bulk import collapsible */}
      {showBulk ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-brand-ink">Bulk Import</h3>
          <p className="mt-1 text-xs text-slate-500">Paste content from Word — separate questions with a blank line.</p>
          <textarea rows="6" value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Subject: Physics\nQ: ...\nA) ...\nB) ...\nAnswer: B"}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs" />
          <button onClick={importQuestions} className="mt-3 rounded-lg bg-brand-primary px-3 py-2 text-xs font-semibold text-white hover:brightness-95">Import</button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        {/* Form */}
        <form onSubmit={submitQuestion} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-base font-semibold text-brand-ink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-primary"><path d="M12 5v14M5 12h14" /></svg>
            {editingId ? "Edit Question" : "Add New Question"}
          </h3>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Question Prompt</label>
              <textarea rows="3" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required
                placeholder="e.g. What is the fundamental theorem of calculus?"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Subject / Category</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Advanced Mathematics" required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Exam Type</label>
                <select value={form.exam} onChange={(e) => setForm({ ...form, exam: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="NEET">NEET</option>
                  <option value="Olympiad">Olympiad</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Chapter (optional)</label>
                <input value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} placeholder="e.g. Calculus"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-ink">Topic (optional)</label>
                <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Derivatives"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Difficulty</label>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {["easy", "medium", "hard"].map((d) => (
                  <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                    className={`flex-1 rounded-md py-1 text-[10px] font-bold uppercase transition ${
                      form.difficulty === d ? "bg-white text-brand-primary shadow-sm" : "text-slate-500"
                    }`}>{d}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-brand-ink">Multiple Choice Options</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => {
                  const checked = form.correctOptions.includes(opt.label);
                  return (
                    <div key={opt.label} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white text-xs font-bold text-brand-primary">{opt.label}</span>
                      <input value={opt.text} onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${opt.label} text...`}
                        className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none" />
                      <button type="button" onClick={() => toggleAnswer(opt.label)}
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          checked ? "border-brand-accent bg-brand-accent" : "border-slate-300 bg-white"
                        }`}>
                        {checked ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3"><path d="M5 13l4 4L19 7" /></svg> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-brand-cta px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95">
              Save Question
            </button>
            <button type="button"
              onClick={() => editingId ? setPreviewQuestion(form) : null}
              disabled={!editingId}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Preview
            </button>
          </div>
        </form>

        {/* Question list */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-card">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quick filter..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400" />
            </div>
            <select value={filters.subject} onChange={(e) => { setFilters({ ...filters, subject: e.target.value }); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium">
              <option value="">Category: All</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.difficulty} onChange={(e) => { setFilters({ ...filters, difficulty: e.target.value }); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium">
              <option value="">Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {!filtered.length ? <EmptyState title="No questions" description="Add or import questions to build the bank." /> : (
            paginated.map((q) => {
              const subClass = SUBJECT_PILL[q.subject?.toLowerCase()] || SUBJECT_PILL.default;
              const diffClass = q.difficulty === "easy" ? "bg-emerald-100 text-emerald-700" : q.difficulty === "hard" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
              return (
                <div key={q._id}
                  className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition-all hover:shadow-cardHover">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${subClass}`}>{q.subject || "—"}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${diffClass}`}>{q.difficulty}</span>
                    <span className="ml-auto text-[10px] text-slate-400">Modified {new Date(q.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-brand-ink">{q.question}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                    {q.correctOptions?.length ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3"><path d="M5 13l4 4L19 7" /></svg>
                        Answer: {q.correctOptions.join(", ")}
                      </span>
                    ) : q.flagged ? (
                      <span className="flex items-center gap-1 text-rose-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15" /></svg>
                        Requires Peer-Review
                      </span>
                    ) : null}
                    <div className="ml-auto flex gap-2">
                      <button type="button" onClick={() => setPreviewQuestion(q)}
                        className="rounded-md bg-brand-surface px-2 py-0.5 text-[10px] font-semibold text-brand-primary hover:brightness-95">
                        Preview
                      </button>
                      <button type="button" onClick={() => startEdit(q)}
                        className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-2 text-xs text-slate-500 shadow-card">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 disabled:opacity-40">‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`rounded px-2 py-0.5 ${page === i + 1 ? "bg-brand-accent text-white" : "border border-slate-200 hover:bg-slate-50"}`}>
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 ? <span>…{totalPages}</span> : null}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50 disabled:opacity-40">›</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuestionBankPage;
