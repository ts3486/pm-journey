"use client";

import { FormSection } from "../shared";
import type { ScenarioInput } from "@/schemas/scenario";

type BasicInfoSectionProps = {
  data: Pick<ScenarioInput, "id" | "title" | "description" | "discipline" | "mode">;
  onChange: (field: keyof ScenarioInput, value: unknown) => void;
  errors: Record<string, string>;
  idDisabled?: boolean;
};

const modeOptions = [
  { value: "guided", label: "ガイド付き" },
  { value: "freeform", label: "自由形式" },
];

export function BasicInfoSection({
  data,
  onChange,
  errors,
  idDisabled = false,
}: BasicInfoSectionProps) {
  return (
    <FormSection
      title="基本情報"
      description="シナリオの基本設定を入力してください"
    >
      <div className="space-y-4">
        {/* ID */}
        <div className="space-y-1">
          <label
            htmlFor="scenario-id"
            className="text-sm font-medium text-slate-700"
          >
            シナリオID <span className="text-rose-500">*</span>
          </label>
          <input
            id="scenario-id"
            type="text"
            value={data.id}
            onChange={(e) => onChange("id", e.target.value.toLowerCase())}
            placeholder="例: basic-intro-custom"
            className="input-base"
            disabled={idDisabled}
          />
          <p className="text-xs text-slate-500">
            小文字英数字とハイフンのみ使用可能
          </p>
          {errors.id && (
            <p className="text-xs text-rose-600">{errors.id}</p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label
            htmlFor="scenario-title"
            className="text-sm font-medium text-slate-700"
          >
            タイトル <span className="text-rose-500">*</span>
          </label>
          <input
            id="scenario-title"
            type="text"
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="例: 自己紹介＆期待値合わせ (カスタム)"
            className="input-base"
          />
          {errors.title && (
            <p className="text-xs text-rose-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label
            htmlFor="scenario-description"
            className="text-sm font-medium text-slate-700"
          >
            説明 <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="scenario-description"
            value={data.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="シナリオの概要を入力..."
            className="input-base min-h-[80px]"
            rows={3}
          />
          {errors.description && (
            <p className="text-xs text-rose-600">{errors.description}</p>
          )}
        </div>

        {/* Discipline */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            難易度 <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discipline"
                value="BASIC"
                checked={data.discipline === "BASIC"}
                onChange={(e) => onChange("discipline", e.target.value)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">BASIC (基礎)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="discipline"
                value="CHALLENGE"
                checked={data.discipline === "CHALLENGE"}
                onChange={(e) => onChange("discipline", e.target.value)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">CHALLENGE (応用)</span>
            </label>
          </div>
          {errors.discipline && (
            <p className="text-xs text-rose-600">{errors.discipline}</p>
          )}
        </div>

        {/* Mode */}
        <div className="space-y-1">
          <label
            htmlFor="scenario-mode"
            className="text-sm font-medium text-slate-700"
          >
            モード <span className="text-rose-500">*</span>
          </label>
          <select
            id="scenario-mode"
            value={data.mode}
            onChange={(e) => onChange("mode", e.target.value)}
            className="input-base"
          >
            {modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.mode && (
            <p className="text-xs text-rose-600">{errors.mode}</p>
          )}
        </div>
      </div>
    </FormSection>
  );
}
