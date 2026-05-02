import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const emptyQuestion = {
  question: "",
  type: "single",
  exam: "NEET",
  subject: "",
  chapter: "",
  topic: "",
  difficulty: "medium",
  marks: 4,
  negativeMarks: 1,
  options: [
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" }
  ],
  correctOptions: [],
  correctNumericAnswer: "",
  writtenAnswer: "",
  explanation: ""
};

const QuestionBankPage = () => {
  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [filters, setFilters] = useState({ exam: "", subject: "" });
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value))).toString();
  const { data: questions, loading, refresh } = useFetch(
    () => api.get(query ? `/exam/questions?${query}` : "/exam/questions"),
    [query]
  );

  const subjects = useMemo(
    () => [...new Set(questions.map((item) => item.subject).filter(Boolean))],
    [questions]
  );

  const updateOption = (index, text) => {
    const options = [...form.options];
    options[index] = { ...options[index], text };
    setForm({ ...form, options });
  };

  const toggleAnswer = (label) => {
    const exists = form.correctOptions.includes(label);
    setForm({
      ...form,
      correctOptions: exists
        ? form.correctOptions.filter((item) => item !== label)
        : form.type === "single" || form.type === "assertion-reason"
          ? [label]
          : [...form.correctOptions, label]
    });
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/exam/questions/${editingId}`, form);
        toast.success("Question updated");
      } else {
        await api.post("/exam/questions", form);
        toast.success("Question added");
      }
      setForm(emptyQuestion);
      setEditingId("");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save question");
    }
  };

  const startEdit = (question) => {
    setEditingId(question._id);
    setForm({
      question: question.question || "",
      type: question.type || "single",
      exam: question.exam || "NEET",
      subject: question.subject || "",
      chapter: question.chapter || "",
      topic: question.topic || "",
      difficulty: question.difficulty || "medium",
      marks: question.marks ?? 4,
      negativeMarks: question.negativeMarks ?? 1,
      options: question.options?.length
        ? question.options
        : emptyQuestion.options,
      correctOptions: question.correctOptions || [],
      correctNumericAnswer: question.correctNumericAnswer ?? "",
      writtenAnswer: question.writtenAnswer || "",
      explanation: question.explanation || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(emptyQuestion);
  };

  const importQuestions = async () => {
    try {
      const { data } = await api.post("/exam/questions/bulk", { text: bulkText });
      toast.success(`${data.count} questions imported`);
      setBulkText("");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to import questions");
    }
  };

  if (loading) return <Loader label="Loading question bank..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Question Bank</h2>
        <p className="mt-2 text-sm text-slate-500">Create tagged NEET and Olympiad questions for adaptive mock tests.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
        <form onSubmit={submitQuestion} className="rounded-[28px] bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl">{editingId ? "Edit Question" : "Add Question"}</h3>
            {editingId ? (
              <button type="button" className="rounded-2xl border px-4 py-2 text-sm font-medium" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
          <div className="mt-5 space-y-4">
            <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows="4" placeholder="Question" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.exam} onChange={(event) => setForm({ ...form, exam: event.target.value })}>
                <option value="NEET">NEET</option>
                <option value="Olympiad">Olympiad</option>
              </select>
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, correctOptions: [] })}>
                <option value="single">Single correct</option>
                <option value="multiple">Multiple correct</option>
                <option value="numeric">Integer/Numeric</option>
                <option value="assertion-reason">Assertion-Reason</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Chapter" value={form.chapter} onChange={(event) => setForm({ ...form, chapter: event.target.value })} required />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} required />
            </div>
            {form.type !== "numeric" ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Select the correct answer option before saving</p>
                {form.options.map((option, index) => (
                  <label key={option.label} className="flex items-center gap-3">
                    <input type={form.type === "multiple" ? "checkbox" : "radio"} checked={form.correctOptions.includes(option.label)} onChange={() => toggleAnswer(option.label)} />
                    <span className="w-6 text-sm font-semibold">{option.label}</span>
                    <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder={`Option ${option.label}`} value={option.text} onChange={(event) => updateOption(index, event.target.value)} />
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Correct numeric answer</p>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Correct numeric answer" value={form.correctNumericAnswer} onChange={(event) => setForm({ ...form, correctNumericAnswer: event.target.value })} />
              </div>
            )}
            {form.type === "numeric" ? (
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows="3" placeholder="Final solution text" value={form.writtenAnswer} onChange={(event) => setForm({ ...form, writtenAnswer: event.target.value })} />
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.marks} onChange={(event) => setForm({ ...form, marks: event.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" value={form.negativeMarks} onChange={(event) => setForm({ ...form, negativeMarks: event.target.value })} />
            </div>
            <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows="3" placeholder="Explanation" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} />
          </div>
          <button className="mt-5 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            {editingId ? "Save Question" : "Add Question"}
          </button>
        </form>

        <section className="space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-panel">
            <h3 className="font-display text-2xl">Bulk Import</h3>
            <p className="mt-2 text-sm text-slate-500">Paste content copied from Word. Separate questions with a blank line.</p>
            <textarea className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm" rows="8" placeholder={"Subject: Physics\nChapter: Motion\nTopic: Velocity\nExam: NEET\nType: single\nQ: A body moves...\nA) 10\nB) 20\nC) 30\nD) 40\nAnswer: B\nWrittenAnswer: Option B is correct.\nExplanation: ..."} value={bulkText} onChange={(event) => setBulkText(event.target.value)} />
            <button className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={importQuestions}>Import Questions</button>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-2xl">Bank</h3>
              <div className="flex flex-wrap gap-2">
                <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={filters.exam} onChange={(event) => setFilters({ ...filters, exam: event.target.value })}>
                  <option value="">All exams</option>
                  <option value="NEET">NEET</option>
                  <option value="Olympiad">Olympiad</option>
                </select>
                <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={filters.subject} onChange={(event) => setFilters({ ...filters, subject: event.target.value })}>
                  <option value="">All subjects</option>
                  {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </div>
            </div>
            {!questions.length ? <div className="mt-5"><EmptyState title="No questions yet" description="Add or import questions to build the bank." /></div> : null}
            <div className="mt-5 space-y-3">
              {questions.slice(0, 12).map((item) => (
                <div key={item._id} className="rounded-3xl border border-slate-100 p-4">
                  <p className="font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.exam} · {item.subject} · {item.chapter} · {item.topic}</p>
                  <p className="mt-2 text-sm font-semibold text-teal-700">
                    Correct: {item.type === "numeric" ? item.correctNumericAnswer : item.correctOptions?.join(", ") || "Not set"}
                  </p>
                  {item.writtenAnswer ? <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{item.writtenAnswer}</p> : null}
                  <button className="mt-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default QuestionBankPage;
