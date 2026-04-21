const StatCard = ({ label, value, helper }) => (
  <div className="rounded-[24px] bg-white p-6 shadow-panel">
    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
    <p className="mt-4 font-display text-4xl text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{helper}</p>
  </div>
);

export default StatCard;
