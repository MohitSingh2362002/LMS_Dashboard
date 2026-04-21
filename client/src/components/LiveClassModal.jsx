import { useState } from "react";
import Modal from "./Modal";

const LiveClassModal = ({ open, onClose, courses, onSubmit, loading }) => {
  const [form, setForm] = useState({
    title: "",
    roomName: "",
    course: "",
    scheduledAt: "",
    isImmediate: true
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Live Class" width="max-w-2xl">
      <div className="space-y-4">
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder="Class title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder="Room name (example: react-batch-1)"
          value={form.roomName}
          onChange={(e) => setForm({ ...form, roomName: e.target.value })}
        />
        <select
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          value={form.course}
          onChange={(e) => setForm({ ...form, course: e.target.value })}
        >
          <option value="">Link to a course (optional)</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            className={`rounded-2xl border px-4 py-4 text-left ${
              form.isImmediate ? "border-teal-700 bg-teal-50" : "border-slate-200"
            }`}
            onClick={() => setForm({ ...form, isImmediate: true })}
          >
            <p className="font-semibold">Start Immediately</p>
            <p className="mt-2 text-sm text-slate-500">Go live now and generate a room URL instantly.</p>
          </button>
          <button
            className={`rounded-2xl border px-4 py-4 text-left ${
              !form.isImmediate ? "border-teal-700 bg-teal-50" : "border-slate-200"
            }`}
            onClick={() => setForm({ ...form, isImmediate: false })}
          >
            <p className="font-semibold">Schedule for Later</p>
            <p className="mt-2 text-sm text-slate-500">Pick a date and time for a planned session.</p>
          </button>
        </div>
        {!form.isImmediate ? (
          <input
            type="datetime-local"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
        ) : null}
        <div className="flex justify-end">
          <button
            className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white"
            disabled={loading}
            onClick={() => onSubmit(form)}
          >
            {loading ? "Saving..." : "Create Live Class"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LiveClassModal;
