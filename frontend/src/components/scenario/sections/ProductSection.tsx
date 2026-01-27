"use client";

import { FormSection, ArrayFieldManager } from "../shared";
import type { ProductInput } from "@/schemas/scenario";

type ProductSectionProps = {
  data: ProductInput;
  onChange: (value: ProductInput) => void;
  errors: Record<string, string>;
};

export function ProductSection({
  data,
  onChange,
  errors,
}: ProductSectionProps) {
  const handleFieldChange = (
    field: keyof ProductInput,
    value: unknown
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <FormSection
      title="プロダクト情報"
      description="シミュレーション対象のプロダクト設定"
    >
      <div className="space-y-6">
        {/* Basic Product Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="product-name"
              className="text-sm font-medium text-slate-700"
            >
              プロダクト名 <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              value={data.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="例: 在庫最適化ダッシュボード"
              className="input-base"
            />
            {errors["product.name"] && (
              <p className="text-xs text-rose-600">{errors["product.name"]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="product-audience"
              className="text-sm font-medium text-slate-700"
            >
              ターゲットユーザー <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-audience"
              type="text"
              value={data.audience}
              onChange={(e) => handleFieldChange("audience", e.target.value)}
              placeholder="例: 店舗マネージャー、在庫管理担当"
              className="input-base"
            />
            {errors["product.audience"] && (
              <p className="text-xs text-rose-600">{errors["product.audience"]}</p>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1">
          <label
            htmlFor="product-summary"
            className="text-sm font-medium text-slate-700"
          >
            概要 <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="product-summary"
            value={data.summary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            placeholder="プロダクトの概要を記載..."
            className="input-base min-h-[80px]"
            rows={3}
          />
          {errors["product.summary"] && (
            <p className="text-xs text-rose-600">{errors["product.summary"]}</p>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-1">
          <label
            htmlFor="product-timeline"
            className="text-sm font-medium text-slate-700"
          >
            タイムライン <span className="text-rose-500">*</span>
          </label>
          <input
            id="product-timeline"
            type="text"
            value={data.timeline}
            onChange={(e) => handleFieldChange("timeline", e.target.value)}
            placeholder="例: 今四半期にβ、次四半期に正式版"
            className="input-base"
          />
          {errors["product.timeline"] && (
            <p className="text-xs text-rose-600">{errors["product.timeline"]}</p>
          )}
        </div>

        {/* Array Fields */}
        <div className="space-y-4 rounded-xl border border-slate-200/60 bg-slate-50/30 p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
            詳細情報
          </p>

          <ArrayFieldManager
            label="課題・問題点 *"
            values={data.problems}
            onChange={(v) => handleFieldChange("problems", v)}
            placeholder="解決すべき課題..."
            error={errors["product.problems"]}
          />

          <ArrayFieldManager
            label="目標 *"
            values={data.goals}
            onChange={(v) => handleFieldChange("goals", v)}
            placeholder="達成目標..."
            error={errors["product.goals"]}
          />

          <ArrayFieldManager
            label="差別化要素 *"
            values={data.differentiators}
            onChange={(v) => handleFieldChange("differentiators", v)}
            placeholder="競合との違い..."
            error={errors["product.differentiators"]}
          />

          <ArrayFieldManager
            label="スコープ *"
            values={data.scope}
            onChange={(v) => handleFieldChange("scope", v)}
            placeholder="対象範囲..."
            error={errors["product.scope"]}
          />

          <ArrayFieldManager
            label="制約 *"
            values={data.constraints}
            onChange={(v) => handleFieldChange("constraints", v)}
            placeholder="制約条件..."
            error={errors["product.constraints"]}
          />

          <ArrayFieldManager
            label="成功基準 *"
            values={data.successCriteria}
            onChange={(v) => handleFieldChange("successCriteria", v)}
            placeholder="成功の指標..."
            error={errors["product.successCriteria"]}
          />
        </div>

        {/* Optional Fields */}
        <div className="space-y-4 rounded-xl border border-slate-200/60 bg-slate-50/30 p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
            オプション情報
          </p>

          <div className="space-y-1">
            <label
              htmlFor="product-unique-edge"
              className="text-sm font-medium text-slate-700"
            >
              独自の強み
            </label>
            <input
              id="product-unique-edge"
              type="text"
              value={data.uniqueEdge ?? ""}
              onChange={(e) => handleFieldChange("uniqueEdge", e.target.value)}
              placeholder="例: 現場が5分で意思決定できるシンプルUI"
              className="input-base"
            />
          </div>

          <ArrayFieldManager
            label="技術スタック"
            values={data.techStack ?? [""]}
            onChange={(v) => handleFieldChange("techStack", v)}
            placeholder="使用技術..."
            minItems={0}
          />

          <ArrayFieldManager
            label="コア機能"
            values={data.coreFeatures ?? [""]}
            onChange={(v) => handleFieldChange("coreFeatures", v)}
            placeholder="主要機能..."
            minItems={0}
          />
        </div>
      </div>
    </FormSection>
  );
}
