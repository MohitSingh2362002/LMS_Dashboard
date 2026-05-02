import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const emptyForm = {
  title: "",
  examPattern: "NEET",
  course: "",
  batch: "",
  questions: [],
  durationMinutes: 180,
  status: "draft"
};

const MockTestsPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [questionSearch, setQuestionSearch] = useState("");
  const { data: tests, loading: loadingTests, refresh } = useFetch(() => api.get("/exam/tests"), []);
  const { data: questions, loading: loadingQuestions } = useFetch(() => api.get("/exam/questions"), []);
  const { data: courses, loading: loadingCourses } = useFetch(() => api.get("/courses"), []);
  const { data: batches, loading: loadingBatches } = useFetch(() => api.get("/batches"), []);

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) =>
        `${question.question} ${question.subject} ${question.chapter} ${question.topic}`
          .toLowerCase()
          .includes(questionSearch.toLowerCase())
      ),
    [questions, questionSearch]
  );

  const toggleQuestion = (questionId) => {
    const exists = form.questions.includes(questionId);
    setForm({
      ...form,
      questions: exists
        ? form.questions.filter((id) => id !== questionId)
        : [...form.questions, questionId]
    });
  };

  const createTest = async (event) => {
    event.preventDefault();
    try {
      await api.post("/exam/tests", form);
      toast.success("Mock test created");
      setForm(emptyForm);
      setQuestionSearch("");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create mock test");
    }
  };

  if (loadingTests || loadingQuestions || loadingCourses || loadingBatches) {
    return <Loader label="Loading mock tests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-teal-700">Exam Cracker</p>
        <h2 className="font-display text-3xl text-slate-900">Mock Tests</h2>
        <p className="mt-2 text-sm text-slate-500">Create NEET and Olympiad pattern tests for all learners or specific batches.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
        <form onSubmit={createTest} className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Create Mock Test</h3>
          <div className="mt-5 space-y-4">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Test title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.examPattern} onChange={(event) => setForm({ ...form, examPattern: event.target.value })}>
                <option value="NEET">NEET</option>
                <option value="Olympiad">Olympiad</option>
              </select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} />
            </div>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })}>
              <option value="">No course restriction</option>
              {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.batch} onChange={(event) => setForm({ ...form, batch: event.target.value })}>
              <option value="">All learners</option>
              {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.name}</option>)}
            </select>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Search question bank" value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} />
          </div>

          <div className="mt-5 max-h-72 space-y-2 overflow-y-auto rounded-3xl border border-slate-100 p-3">
            {filteredQuestions.map((question) => (
              <label key={question._id} className="flex items-start gap-3 rounded-2xl px-3 py-2 text-sm hover:bg-slate-50">
                <input className="mt-1" type="checkbox" checked={form.questions.includes(question._id)} onChange={() => toggleQuestion(question._id)} />
                <span>
                  <span className="font-medium text-slate-900">{question.question}</span>
                  <span className="mt-1 block text-xs text-slate-500">{question.subject} · {question.chapter} · {question.topic}</span>
                </span>
              </label>
            ))}
          </div>

          <button className="mt-5 w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white">
            Create Test with {form.questions.length} Questions
          </button>
        </form>

        <section className="rounded-[28px] bg-white p-6 shadow-panel">
          <h3 className="font-display text-2xl">Test Library</h3>
          {!tests.length ? <div className="mt-5"><EmptyState title="No tests yet" description="Create a mock test from your question bank." /></div> : null}
          <div className="mt-5 space-y-4">
            {tests.map((test) => (
              <div key={test._id} className="rounded-3xl border border-slate-100 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{test.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{test.examPattern} · {test.durationMinutes} min · {test.questions?.length || 0} questions</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{test.status}</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {test.batch?.name || "All learners"} · Updated {formatDate(test.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MockTestsPage;
