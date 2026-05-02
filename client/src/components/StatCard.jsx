import { classNames } from "../utils/helpers";

const trendIcon = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

const trendColor = {
  up: "text-emerald-600",
  down: "text-rose-600",
  neutral: "text-slate-400",
};

const accentMap = {
  teal: "bg-teal-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  slate: "bg-slate-500",
};

const StatCard = ({ label, value, helper, icon, trend, accentColor = "teal" }) => (
  <div className="animate-fadeIn relative overflow-hidden rounded-[24px] bg-white p-6 shadow-panel">
    <div className={classNames("absolute left-0 top-0 h-full w-1 rounded-l-[24px]", accentMap[accentColor] || accentMap.teal)} />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="font-display text-4xl text-slate-900">{value}</p>
          {trend ? (
            <span className={classNames("text-sm font-semibold", trendColor[trend] || trendColor.neutral)}>
              {trendIcon[trend] || ""}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
      </div>
      {icon ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-xl">
          {icon}
        </div>
      ) : null}
    </div>
  </div>
);

export default StatCard;
