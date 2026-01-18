type ProgressTrackerProps = {
  requirements: boolean;
  priorities: boolean;
  risks: boolean;
  acceptance: boolean;
};

export function ProgressTracker({ requirements, priorities, risks, acceptance }: ProgressTrackerProps) {
  const items = [
    { label: "Requirements", done: requirements },
    { label: "Priorities", done: priorities },
    { label: "Risks", done: risks },
    { label: "Acceptance", done: acceptance },
  ];
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
      <div className="text-xs font-semibold text-gray-600">Progress</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.done ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
      {requirements && priorities && risks && acceptance ? (
        <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          Evaluation available
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-500">Complete all items to enable evaluation.</div>
      )}
    </div>
  );
}
