const Stars = ({ rating, onChange, readonly = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((value) => (
      <button
        key={value}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(value)}
        className={`text-xl ${value <= rating ? "text-amber-400" : "text-slate-300"} ${
          readonly ? "cursor-default" : ""
        }`}
      >
        ★
      </button>
    ))}
  </div>
);

export default Stars;
