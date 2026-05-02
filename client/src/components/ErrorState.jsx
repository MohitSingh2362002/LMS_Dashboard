const ErrorState = ({ title = "Something went wrong", message = "We couldn't load this data. Please try again.", onRetry }) => (
  <div className="animate-fadeIn rounded-[28px] border border-dashed border-rose-200 bg-rose-50/60 p-10 text-center shadow-panel">
    <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-amber-100 text-4xl">
      ⚠
    </div>
    <h3 className="font-display text-2xl text-slate-900">{title}</h3>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">{message}</p>
    {onRetry ? (
      <button
        className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        onClick={onRetry}
      >
        Try Again
      </button>
    ) : null}
  </div>
);

export default ErrorState;
