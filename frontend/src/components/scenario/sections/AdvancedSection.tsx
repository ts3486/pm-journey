"use client";

import { FormSection } from "../shared";
import type { ScenarioInput } from "@/schemas/scenario";

type AdvancedSectionProps = {
  data: Pick<ScenarioInput, "kickoffPrompt" | "passingScore" | "supplementalInfo">;
  onChange: (field: keyof ScenarioInput, value: unknown) => void;
  errors: Record<string, string>;
};

export function AdvancedSection({
  data,
  onChange,
  errors,
}: AdvancedSectionProps) {
  return (
    <FormSection
      title="詳細設定"
      description="キックオフプロンプトと評価設定"
      defaultOpen={false}
    >
      <div className="space-y-4">
        {/* Kickoff Prompt */}
        <div className="space-y-1">
          <label
            htmlFor="kickoff-prompt"
            className="text-sm font-medium text-slate-700"
          >
            キックオフプロンプト <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            シナリオ開始時にAIが最初に表示するメッセージ
          </p>
          <textarea
            id="kickoff-prompt"
            value={data.kickoffPrompt}
            onChange={(e) => onChange("kickoffPrompt", e.target.value)}
            placeholder="例: こんにちは！エンジニア兼デザイナーの鈴木です。よろしくお願いします。"
            className="input-base min-h-[120px]"
            rows={4}
          />
          {errors.kickoffPrompt && (
            <p className="text-xs text-rose-600">{errors.kickoffPrompt}</p>
          )}
        </div>

        {/* Passing Score */}
        <div className="space-y-1">
          <label
            htmlFor="passing-score"
            className="text-sm font-medium text-slate-700"
          >
            合格スコア
          </label>
          <p className="text-xs text-slate-500">
            合格と判定する最低スコア (0-100)
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              id="passing-score-slider"
              min={0}
              max={100}
              value={data.passingScore ?? 70}
              onChange={(e) =>
                onChange("passingScore", parseInt(e.target.value, 10))
              }
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <input
              id="passing-score"
              type="number"
              min={0}
              max={100}
              value={data.passingScore ?? 70}
              onChange={(e) =>
                onChange("passingScore", parseInt(e.target.value, 10) || 0)
              }
              className="input-base w-20 text-center"
            />
          </div>
          {errors.passingScore && (
            <p className="text-xs text-rose-600">{errors.passingScore}</p>
          )}
        </div>

        {/* Supplemental Info */}
        <div className="space-y-1">
          <label
            htmlFor="supplemental-info"
            className="text-sm font-medium text-slate-700"
          >
            補足情報
          </label>
          <p className="text-xs text-slate-500">
            ユーザーに表示する追加のガイダンスや注意点
          </p>
          <textarea
            id="supplemental-info"
            value={data.supplementalInfo ?? ""}
            onChange={(e) => onChange("supplementalInfo", e.target.value)}
            placeholder="例: 時間配分（5分自己紹介/15分期待値/10分次アクション）を意識してください。"
            className="input-base min-h-[80px]"
            rows={3}
          />
          {errors.supplementalInfo && (
            <p className="text-xs text-rose-600">{errors.supplementalInfo}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
}
