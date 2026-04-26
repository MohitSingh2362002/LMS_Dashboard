import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import RichTextEditor from "./RichTextEditor";
import { getFullImageUrl } from "../utils/helpers";

const defaultCourse = {
  title: "",
  tagsInput: "",
  instructorDisplayName: "",
  instructor: "",
  description: "",
  tagline: "",
  pricing: { type: "free", amount: 0, currency: "USD" },
  pages: [{ title: "Introduction", content: "" }],
  advancedSettings: { accessDuration: 365, certificateEnabled: false },
  status: "draft",
  thumbnailFile: null,
  thumbnailPreview: ""
};

const CourseFormModal = ({ open, onClose, onSubmit, instructors, initialValue, loading }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [form, setForm] = useState(defaultCourse);

  const getInstructorName = (instructorId) =>
    instructors.find((item) => item._id === instructorId)?.name || "";

  useEffect(() => {
    if (!initialValue) {
      setForm(defaultCourse);
      return;
    }

    setForm({
      title: initialValue.title || "",
      tagsInput: (initialValue.tags || []).join(", "),
      instructorDisplayName: initialValue.instructorDisplayName || "",
      instructor: initialValue.instructor?._id || initialValue.instructor || "",
      description: initialValue.description || "",
      tagline: initialValue.tagline || "",
      pricing: initialValue.pricing || { type: "free", amount: 0, currency: "USD" },
      pages: initialValue.pages?.length ? initialValue.pages : [{ title: "Introduction", content: "" }],
      advancedSettings: initialValue.advancedSettings || {
        accessDuration: 365,
        certificateEnabled: false
      },
      status: initialValue.status || "draft",
      thumbnailFile: null,
      thumbnailPreview: getFullImageUrl(initialValue.thumbnail)
    });
  }, [initialValue, open]);

  const tabs = useMemo(
    () => [
      { id: "details", label: "Details" },
      { id: "pricing", label: "Pricing" },
      { id: "pages", label: "Pages" },
      { id: "advanced", label: "Advanced" }
    ],
    []
  );

  const submit = (statusOverride) => {
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("tags", JSON.stringify(form.tagsInput.split(",").map((item) => item.trim()).filter(Boolean)));
    payload.append("instructorDisplayName", form.instructorDisplayName);
    payload.append("instructor", form.instructor);
    payload.append("description", form.description);
    payload.append("tagline", form.tagline);
    payload.append("pricing", JSON.stringify(form.pricing));
    payload.append("pages", JSON.stringify(form.pages));
    payload.append("advancedSettings", JSON.stringify(form.advancedSettings));
    payload.append("status", statusOverride || form.status);
    if (form.thumbnailFile) payload.append("thumbnail", form.thumbnailFile);
    onSubmit(payload);
  };

  const updatePage = (index, key, value) => {
    setForm((current) => ({
      ...current,
      pages: current.pages.map((page, pageIndex) =>
        pageIndex === index ? { ...page, [key]: value } : page
      )
    }));
  };

  const movePage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= form.pages.length) return;
    const pages = [...form.pages];
    const [moved] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, moved);
    setForm((current) => ({ ...current, pages }));
  };

  return (
    <Modal open={open} onClose={onClose} title={initialValue ? "Edit Course" : "Create Course"}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`rounded-full px-4 py-2 text-sm ${
                activeTab === tab.id ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" && (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Title</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Tags</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.tagsInput}
                onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
                placeholder="react, frontend, starter"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Instructor Display Name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.instructorDisplayName}
                onChange={(e) => setForm({ ...form, instructorDisplayName: e.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Instructor</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.instructor}
                onChange={(e) => {
                  const nextInstructorId = e.target.value;
                  setForm((current) => ({
                    ...current,
                    instructor: nextInstructorId,
                    instructorDisplayName: nextInstructorId
                      ? getInstructorName(nextInstructorId)
                      : ""
                  }));
                }}
              >
                <option value="">Select instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.name} · {instructor.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Thumbnail</span>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setForm({
                    ...form,
                    thumbnailFile: file || null,
                    thumbnailPreview: file ? URL.createObjectURL(file) : form.thumbnailPreview
                  });
                }}
              />
              {form.thumbnailPreview ? (
                <img
                  src={form.thumbnailPreview}
                  alt="preview"
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : null}
            </label>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <RichTextEditor
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Course Tagline</span>
              <RichTextEditor
                value={form.tagline}
                onChange={(value) => setForm({ ...form, tagline: value })}
              />
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="grid gap-5 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium">Pricing Type</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.pricing.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pricing: { ...form.pricing, type: e.target.value, amount: e.target.value === "free" ? 0 : form.pricing.amount }
                  })
                }
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Amount</span>
              <input
                type="number"
                disabled={form.pricing.type === "free"}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-100"
                value={form.pricing.amount}
                onChange={(e) =>
                  setForm({ ...form, pricing: { ...form.pricing, amount: Number(e.target.value) } })
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Currency</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.pricing.currency}
                onChange={(e) =>
                  setForm({ ...form, pricing: { ...form.pricing, currency: e.target.value } })
                }
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="space-y-4">
            {form.pages.map((page, index) => (
              <div key={`${page.title}-${index}`} className="rounded-3xl border border-slate-200 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">Page {index + 1}</p>
                  <div className="flex gap-2">
                    <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => movePage(index, index - 1)}>
                      Move Up
                    </button>
                    <button className="rounded-xl border px-3 py-2 text-sm" onClick={() => movePage(index, index + 1)}>
                      Move Down
                    </button>
                    <button
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          pages: current.pages.filter((_, pageIndex) => pageIndex !== index)
                        }))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <input
                  className="mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={page.title}
                  onChange={(e) => updatePage(index, "title", e.target.value)}
                  placeholder="Page title"
                />
                <RichTextEditor value={page.content} onChange={(value) => updatePage(index, "content", value)} />
              </div>
            ))}
            <button
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  pages: [...current.pages, { title: `Chapter ${current.pages.length + 1}`, content: "" }]
                }))
              }
            >
              Add Page
            </button>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Access Duration (days)</span>
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={form.advancedSettings.accessDuration}
                onChange={(e) =>
                  setForm({
                    ...form,
                    advancedSettings: {
                      ...form.advancedSettings,
                      accessDuration: Number(e.target.value)
                    }
                  })
                }
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={form.advancedSettings.certificateEnabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    advancedSettings: {
                      ...form.advancedSettings,
                      certificateEnabled: e.target.checked
                    }
                  })
                }
              />
              <span className="text-sm font-medium">Enable certificate on completion</span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium"
            onClick={() => submit("draft")}
            disabled={loading}
          >
            Save as Draft
          </button>
          <button
            className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            onClick={() => submit("published")}
            disabled={loading}
          >
            {loading ? "Saving..." : "Publish Course"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CourseFormModal;
