const Loader = ({ fullScreen = false, label = "Loading..." }) => (
  <div
    className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[200px]"}`}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

export default Loader;
