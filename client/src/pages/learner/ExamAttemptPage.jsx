import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/client";
import Loader from "../../components/Loader";
import useFetch from "../../hooks/useFetch";

const ExamAttemptPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { data: test, loading } = useFetch(() => api.get(`/exam/tests/${testId}`), [testId]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);

  const setOption = (question, option, multiple) => {
    const current = answers[question._id]?.selectedOptions || [];
    const selectedOptions = multiple
      ? current.includes(option.label)
        ? current.filter((item) => item !== option.label)
        : [...current, option.label]
      : [option.label];

    setAnswers({ ...answers, [question._id]: { question: question._id, selectedOptions } });
  };

  const setNumeric = (question, value) => {
    setAnswers({ ...answers, [question._id]: { question: question._id, numericAnswer: value } });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.values(answers),
        timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000)
      };
      const { data } = await api.post(`/exam/tests/${testId}/attempts`, payload);
      toast.success("Test submitted");
      navigate(`/learner/exam/results/${data._id}`, { state: { attempt: data } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading test..." />;

  return (
    <div className="space-y-6">
      <div className="sticky top-24 z-20 rounded-[28px] bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-teal-700">{test.examPattern}</p>
            <h2 className="font-display text-3xl text-slate-900">{test.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{test.durationMinutes} minutes · {test.questions?.length || 0} questions</p>
          </div>
          <button className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-medium text-white" disabled={submitting} onClick={submit}>
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {test.questions?.map((question, index) => (
          <section key={question._id} className="rounded-[28px] bg-white p-6 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="max-w-3xl text-lg font-semibold text-slate-900">{index + 1}. {question.question}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{question.type}</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{question.subject} · {question.chapter} · {question.topic}</p>
            {question.type === "numeric" ? (
              <input className="mt-5 w-full max-w-sm rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter numeric answer" value={answers[question._id]?.numericAnswer || ""} onChange={(event) => setNumeric(question, event.target.value)} />
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {question.options?.map((option) => (
                  <label key={option.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 hover:bg-slate-50">
                    <input
                      className="mt-1"
                      type={question.type === "multiple" ? "checkbox" : "radio"}
                      checked={(answers[question._id]?.selectedOptions || []).includes(option.label)}
                      onChange={() => setOption(question, option, question.type === "multiple")}
                    />
                    <span><span className="font-semibold">{option.label}.</span> {option.text}</span>
                  </label>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default ExamAttemptPage;
