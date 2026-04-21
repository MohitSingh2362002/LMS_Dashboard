const Modal = ({ open, title, children, onClose, width = "max-w-4xl" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className={`w-full ${width} rounded-[28px] bg-white p-6 shadow-panel`}>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-2xl text-slate-900">{title}</h3>
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
