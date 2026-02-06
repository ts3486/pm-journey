"use client";

import type { ScoringGuidelinesInput } from "@/schemas/scenario";

type ScoringGuidelinesEditorProps = {
  value: ScoringGuidelinesInput;
  onChange: (value: ScoringGuidelinesInput) => void;
  errors?: Partial<Record<keyof ScoringGuidelinesInput, string>>;
};

const guidelineLabels: { key: keyof ScoringGuidelinesInput; label: string; color: string }[] = [
  { key: "excellent", label: "優秀 (90-100点)", color: "emerald" },
  { key: "good", label: "良好 (70-89点)", color: "blue" },
  { key: "needsImprovement", label: "改善が必要 (50-69点)", color: "amber" },
  { key: "poor", label: "不十分 (0-49点)", color: "rose" },
];

export function ScoringGuidelinesEditor({
  value,
  onChange,
  errors,
}: ScoringGuidelinesEditorProps) {
  const handleChange = (key: keyof ScoringGuidelinesInput, newValue: string) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 space-y-4">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        スコアリングガイドライン
      </p>

      <div className="space-y-3">
        {guidelineLabels.map(({ key, label, color }) => (
          <div key={key} className="space-y-1">
            <label
              htmlFor={`guideline-${key}`}
              className={`text-xs font-medium text-${color}-700 flex items-center gap-2`}
            >
              <span
                className={`h-2 w-2 rounded-full bg-${color}-400`}
              />
              {label}
            </label>
            <textarea
              id={`guideline-${key}`}
              value={value[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={`${label}の評価基準を記載...`}
              className="input-base text-sm min-h-[60px] resize-y"
              rows={2}
            />
            {errors?.[key] && (
              <p className="text-xs text-rose-600">{errors[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
