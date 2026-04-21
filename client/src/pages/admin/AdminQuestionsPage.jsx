import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/client";
import useFetch from "../../hooks/useFetch";
import Loader from "../../components/Loader";
import { formatDate } from "../../utils/helpers";

const AdminQuestionsPage = () => {
  const [filter, setFilter] = useState("");
  const { data: questions, loading, refresh } = useFetch(
    () => api.get(filter ? `/questions?answered=${filter}` : "/questions"),
    [filter]
  );
  const [answers, setAnswers] = useState({});

  const answerQuestion = async (id) => {
    try {
      await api.put(`/questions/${id}/answer`, { answer: answers[id] || "" });
      toast.success("Question answered");
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to answer question");
    }
  };

  if (loading) return <Loader label="Loading Q&A..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Public Q&A</h2>
          <p className="mt-2 text-sm text-slate-500">Respond to learner questions and track unanswered items.</p>
        </div>
        <div className="flex gap-2 rounded-full bg-white p-2 shadow-panel">
          {[["", "All"], ["false", "Unanswered"], ["true", "Answered"]].map(([value, label]) => (
            <button
              key={label}
              className={`rounded-full px-4 py-2 text-sm ${filter === value ? "bg-teal-700 text-white" : "text-slate-500"}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {questions.map((item) => (
          <div key={item._id} className="rounded-[28px] bg-white p-6 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{item.course?.title || "General question"} · {item.askedBy?.name}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.question}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isAnswered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {item.isAnswered ? "Answered" : "Pending"}
              </span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">{formatDate(item.createdAt)}</p>
            {item.isAnswered ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{item.answer}</div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <textarea
                  rows="3"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Type your answer"
                  value={answers[item._id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [item._id]: e.target.value })}
                />
                <div className="flex justify-end">
                  <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white" onClick={() => answerQuestion(item._id)}>
                    Mark Answered
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuestionsPage;
