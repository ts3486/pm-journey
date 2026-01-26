"use client";

import { FormSection } from "../shared";
import type { ScenarioBehaviorInput } from "@/schemas/scenario";

type BehaviorSectionProps = {
  data: ScenarioBehaviorInput | undefined;
  onChange: (value: ScenarioBehaviorInput) => void;
  errors: Record<string, string>;
};

const responseStyleOptions = [
  { value: "acknowledge_then_wait", label: "確認後待機 (acknowledge_then_wait)" },
  { value: "guide_lightly", label: "軽くガイド (guide_lightly)" },
  { value: "advisor", label: "アドバイザー (advisor)" },
];

export function BehaviorSection({
  data,
  onChange,
  errors,
}: BehaviorSectionProps) {
  const behavior = data ?? {
    userLed: false,
    allowProactive: true,
    maxQuestions: 1,
    responseStyle: "guide_lightly" as const,
    phase: "",
  };

  const handleChange = (
    field: keyof ScenarioBehaviorInput,
    value: unknown
  ) => {
    onChange({
      ...behavior,
      [field]: value,
    });
  };

  return (
    <FormSection
      title="AI動作設定"
      description="AIエージェントの振る舞いを設定します"
      optional
      defaultOpen={false}
    >
      <div className="space-y-4">
        {/* User Led */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-slate-700">
              ユーザー主導モード
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              ユーザーがリードする形式にする
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={behavior.userLed ?? false}
              onChange={(e) => handleChange("userLed", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>

        {/* Allow Proactive */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-slate-700">
              プロアクティブ応答
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              AIが自発的に提案を行う
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={behavior.allowProactive ?? true}
              onChange={(e) => handleChange("allowProactive", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>

        {/* Max Questions */}
        <div className="space-y-1">
          <label
            htmlFor="max-questions"
            className="text-sm font-medium text-slate-700"
          >
            最大質問数
          </label>
          <p className="text-xs text-slate-500">
            AIが1ターンで行う質問の上限 (0 = 無制限)
          </p>
          <input
            id="max-questions"
            type="number"
            min={0}
            max={10}
            value={behavior.maxQuestions ?? 1}
            onChange={(e) =>
              handleChange("maxQuestions", parseInt(e.target.value, 10) || 0)
            }
            className="input-base w-32"
          />
          {errors["behavior.maxQuestions"] && (
            <p className="text-xs text-rose-600">
              {errors["behavior.maxQuestions"]}
            </p>
          )}
        </div>

        {/* Response Style */}
        <div className="space-y-1">
          <label
            htmlFor="response-style"
            className="text-sm font-medium text-slate-700"
          >
            応答スタイル
          </label>
          <select
            id="response-style"
            value={behavior.responseStyle ?? "guide_lightly"}
            onChange={(e) =>
              handleChange(
                "responseStyle",
                e.target.value as ScenarioBehaviorInput["responseStyle"]
              )
            }
            className="input-base"
          >
            {responseStyleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors["behavior.responseStyle"] && (
            <p className="text-xs text-rose-600">
              {errors["behavior.responseStyle"]}
            </p>
          )}
        </div>

        {/* Phase */}
        <div className="space-y-1">
          <label
            htmlFor="phase"
            className="text-sm font-medium text-slate-700"
          >
            フェーズ
          </label>
          <p className="text-xs text-slate-500">
            シナリオのフェーズを指定 (任意)
          </p>
          <input
            id="phase"
            type="text"
            value={behavior.phase ?? ""}
            onChange={(e) => handleChange("phase", e.target.value)}
            placeholder="例: intro, discovery, planning"
            className="input-base"
          />
          {errors["behavior.phase"] && (
            <p className="text-xs text-rose-600">{errors["behavior.phase"]}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
}
