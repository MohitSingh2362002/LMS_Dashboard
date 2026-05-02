const Skeleton = ({ rows = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="animate-shimmer h-4 rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:800px_100%]" />
    ))}
  </div>
);

const Loader = ({ fullScreen = false, label = "Loading...", variant = "spinner", rows = 3 }) => {
  if (variant === "skeleton") {
    return (
      <div className="animate-fadeIn space-y-5 p-2">
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[24px] bg-white p-6 shadow-panel">
              <div className="animate-shimmer mb-3 h-3 w-24 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:800px_100%]" />
              <div className="animate-shimmer h-8 w-16 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:800px_100%]" />
            </div>
          ))}
        </div>
        <div className="rounded-[28px] bg-white p-6 shadow-panel">
          <Skeleton rows={rows} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[200px]"}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
};

export default Loader;
