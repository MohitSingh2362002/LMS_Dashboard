import { useRef } from "react";

const tools = [
  { label: "B", command: "bold" },
  { label: "I", command: "italic" },
  { label: "U", command: "underline" },
  { label: "OL", command: "insertOrderedList" },
  { label: "UL", command: "insertUnorderedList" }
];

const RichTextEditor = ({ value, onChange, placeholder = "Write here..." }) => {
  const ref = useRef(null);

  const runCommand = (command) => {
    ref.current?.focus();
    document.execCommand(command);
    onChange(ref.current?.innerHTML || "");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
        {tools.map((tool) => (
          <button
            type="button"
            key={tool.command}
            onClick={() => runCommand(tool.command)}
            className="rounded-xl border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600"
          >
            {tool.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-[160px] p-4 text-sm leading-6 text-slate-700 outline-none"
        dangerouslySetInnerHTML={{ __html: value || "" }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
