const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div className={`animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel ${className}`}>
    {title ? (
      <div className="mb-5">
        <h3 className="font-display text-2xl text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    ) : null}
    {children}
  </div>
);

export default ChartCard;
