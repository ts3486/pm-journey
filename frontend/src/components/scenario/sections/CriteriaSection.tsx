"use client";

import { FormSection, ScoringGuidelinesEditor } from "../shared";
import type { RatingCriterionInput } from "@/schemas/scenario";
import { defaultRatingCriterion, defaultScoringGuidelines } from "@/schemas/scenario";

type CriteriaSectionProps = {
  data: RatingCriterionInput[];
  onChange: (value: RatingCriterionInput[]) => void;
  errors: Record<string, string>;
};

export function CriteriaSection({
  data,
  onChange,
  errors,
}: CriteriaSectionProps) {
  const totalWeight = data.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = totalWeight === 100;

  const handleAdd = () => {
    const newId = `criterion-${data.length + 1}`;
    const remainingWeight = Math.max(0, 100 - totalWeight);
    onChange([
      ...data,
      {
        ...defaultRatingCriterion,
        id: newId,
        weight: Math.min(25, remainingWeight),
      },
    ]);
  };

  const handleRemove = (index: number) => {
    if (data.length <= 1) return;
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const handleChange = (
    index: number,
    field: keyof RatingCriterionInput,
    value: unknown
  ) => {
    const newData = [...data];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };
    onChange(newData);
  };

  const handleDistributeEvenly = () => {
    const count = data.length;
    if (count === 0) return;

    const baseWeight = Math.floor(100 / count);
    const remainder = 100 % count;

    const newData = data.map((criterion, index) => ({
      ...criterion,
      weight: baseWeight + (index < remainder ? 1 : 0),
    }));
    onChange(newData);
  };

  return (
    <FormSection
      title="評価基準"
      description="パフォーマンス評価の基準を設定（重みの合計は100%）"
    >
      <div className="space-y-4">
        {/* Weight Summary */}
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 ${
            isWeightValid
              ? "bg-emerald-50 border border-emerald-200/60"
              : "bg-amber-50 border border-amber-200/60"
          }`}
        >
          <div className="flex items-center gap-2">
            {isWeightValid ? (
              <svg
                className="h-5 w-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            <span
              className={`text-sm font-medium ${
                isWeightValid ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              合計: {totalWeight}% / 100%
            </span>
          </div>
          <button
            type="button"
            onClick={handleDistributeEvenly}
            className="text-xs font-medium text-slate-600 hover:text-slate-800 transition"
          >
            均等配分
          </button>
        </div>

        {errors.evaluationCriteria && (
          <p className="text-xs text-rose-600">{errors.evaluationCriteria}</p>
        )}

        {/* Criteria List */}
        <div className="space-y-4">
          {data.map((criterion, index) => (
            <div
              key={criterion.id || index}
              className="rounded-xl border border-slate-200/60 bg-white p-4 space-y-4"
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                  {index + 1}
                </span>
                {data.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="text-xs text-slate-400 hover:text-rose-500 transition"
                  >
                    削除
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    基準ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={criterion.id}
                    onChange={(e) => handleChange(index, "id", e.target.value)}
                    placeholder="例: communication-skill"
                    className="input-base"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    名前 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => handleChange(index, "name", e.target.value)}
                    placeholder="例: コミュニケーション力"
                    className="input-base"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  説明 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={criterion.description}
                  onChange={(e) =>
                    handleChange(index, "description", e.target.value)
                  }
                  placeholder="この評価基準の詳細..."
                  className="input-base min-h-[60px]"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  重み (%) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={criterion.weight}
                    onChange={(e) =>
                      handleChange(index, "weight", parseInt(e.target.value, 10))
                    }
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={criterion.weight}
                    onChange={(e) =>
                      handleChange(
                        index,
                        "weight",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="input-base w-20 text-center"
                  />
                </div>
              </div>

              <ScoringGuidelinesEditor
                value={criterion.scoringGuidelines}
                onChange={(v) => handleChange(index, "scoringGuidelines", v)}
              />
            </div>
          ))}
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
        >
          <span className="inline-flex items-center gap-2">
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
            評価基準を追加
          </span>
        </button>
      </div>
    </FormSection>
  );
}
