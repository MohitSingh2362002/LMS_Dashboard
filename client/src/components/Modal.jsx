const Modal = ({ open, title, children, onClose, width = "max-w-4xl" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-6">
      <div className="flex min-h-full items-start justify-center">
        <div
          className={`flex w-full ${width} max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] bg-white shadow-panel sm:max-h-[calc(100vh-3rem)]`}
        >
        <div className="mb-0 flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="font-display text-2xl text-slate-900">{title}</h3>
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
