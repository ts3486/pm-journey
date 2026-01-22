"use client";

type ProgressTrackerProps = {
  requirements: boolean;
  priorities: boolean;
  risks: boolean;
  acceptance: boolean;
  onComplete?: () => void;
  disabled?: boolean;
};

export function ProgressTracker({
  requirements,
  priorities,
  risks,
  acceptance,
  onComplete,
  disabled = false,
}: ProgressTrackerProps) {
  const items = [
    { label: "Requirements", done: requirements },
    { label: "Priorities", done: priorities },
    { label: "Risks", done: risks },
    { label: "Acceptance", done: acceptance },
  ];
  return (
    <div className="card p-4 text-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progress</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              item.done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
      {requirements && priorities && risks && acceptance ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          Evaluation available
        </div>
      ) : (
        <div className="mt-3 text-xs text-slate-500">Complete all items to enable evaluation.</div>
      )}
      {onComplete ? (
        <button
          type="button"
          className="mt-3 w-full rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200"
          onClick={onComplete}
          disabled={disabled}
        >
          Mark progress complete
        </button>
      ) : null}
    </div>
  );
}
