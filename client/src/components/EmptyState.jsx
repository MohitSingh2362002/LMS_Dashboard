const EmptyState = ({ title, description, action }) => (
  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-panel">
    <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-teal-100 text-4xl">
      ✦
    </div>
    <h3 className="font-display text-2xl text-slate-900">{title}</h3>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

export default EmptyState;
