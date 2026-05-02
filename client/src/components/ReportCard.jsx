const gradeFromPercent = (pct) => {
  if (pct >= 90) return { letter: "A+", color: "text-emerald-600 bg-emerald-50" };
  if (pct >= 80) return { letter: "A", color: "text-emerald-600 bg-emerald-50" };
  if (pct >= 70) return { letter: "B+", color: "text-teal-700 bg-teal-50" };
  if (pct >= 60) return { letter: "B", color: "text-teal-700 bg-teal-50" };
  if (pct >= 50) return { letter: "C", color: "text-amber-700 bg-amber-50" };
  if (pct >= 40) return { letter: "D", color: "text-orange-700 bg-orange-50" };
  return { letter: "F", color: "text-rose-700 bg-rose-50" };
};

const ReportCard = ({ name, subjects = [], overallPercent = 0, rank, avatarInitials }) => {
  const overall = gradeFromPercent(overallPercent);

  return (
    <div className="animate-fadeIn rounded-[28px] bg-white p-6 shadow-panel">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-lg font-bold uppercase text-white">
          {avatarInitials || name?.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl text-slate-900">{name}</h3>
          <div className="mt-1 flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${overall.color}`}>
              {overall.letter}
            </span>
            <span className="text-sm text-slate-500">{overallPercent}% overall</span>
            {rank ? (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                Rank #{rank}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {subjects.length ? (
        <div className="mt-5 space-y-3">
          {subjects.map((subj) => {
            const g = gradeFromPercent(subj.accuracy);
            return (
              <div key={subj.name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm font-medium text-slate-700">{subj.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      subj.accuracy >= 70 ? "bg-teal-600" : subj.accuracy >= 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, subj.accuracy))}%` }}
                  />
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${g.color}`}>{g.letter}</span>
                <span className="w-10 shrink-0 text-right text-xs text-slate-500">{subj.accuracy}%</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default ReportCard;
