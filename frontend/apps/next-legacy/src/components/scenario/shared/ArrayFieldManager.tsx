"use client";

type ArrayFieldManagerProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  minItems?: number;
  error?: string;
};

export function ArrayFieldManager({
  label,
  values,
  onChange,
  placeholder = "項目を入力...",
  minItems = 1,
  error,
}: ArrayFieldManagerProps) {
  const handleAdd = () => {
    onChange([...values, ""]);
  };

  const handleRemove = (index: number) => {
    if (values.length <= minItems) return;
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 transition"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          追加
        </button>
      </div>

      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={placeholder}
              className="input-base flex-1"
            />
            {values.length > minItems && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      )}
    </div>
  );
}
