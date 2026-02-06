"use client";

import { useState, useMemo, useCallback } from "react";
import { FormSection, ArrayFieldManager } from "../scenario/shared";
import { useProductConfig, useUpdateProductConfig, useResetProductConfig } from "@/queries/productConfig";
import { productConfigSchema, type ProductConfigFormValues } from "@/schemas/scenario";
import type { UpdateProductConfigRequest, ProductConfig } from "@pm-journey/types";

function toFormData(config: ProductConfig | undefined): ProductConfigFormValues {
  if (!config) {
    return {
      name: "",
      summary: "",
      audience: "",
      problems: [""],
      goals: [""],
      differentiators: [],
      scope: [],
      constraints: [],
      timeline: "",
      successCriteria: [],
      uniqueEdge: "",
      techStack: [],
      coreFeatures: [],
    };
  }
  return {
    name: config.name,
    summary: config.summary,
    audience: config.audience,
    problems: config.problems.length > 0 ? config.problems : [""],
    goals: config.goals.length > 0 ? config.goals : [""],
    differentiators: config.differentiators,
    scope: config.scope,
    constraints: config.constraints,
    timeline: config.timeline ?? "",
    successCriteria: config.successCriteria,
    uniqueEdge: config.uniqueEdge ?? "",
    techStack: config.techStack,
    coreFeatures: config.coreFeatures,
  };
}

// Inner form component that resets when key changes
function ProductConfigFormInner({
  initialData,
  productConfig,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: {
  initialData: ProductConfigFormValues;
  productConfig: ProductConfig | undefined;
  onSave: (payload: UpdateProductConfigRequest) => Promise<void>;
  onReset: () => Promise<void>;
  isSaving: boolean;
  isResetting: boolean;
}) {
  const [formData, setFormData] = useState<ProductConfigFormValues>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const handleFieldChange = useCallback((field: keyof ProductConfigFormValues, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
  }, []);

  const handleSubmit = async () => {
    setErrors({});
    setSuccessMessage(null);

    const result = productConfigSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        newErrors[path] = issue.message;
      }
      setErrors(newErrors);
      return;
    }

    const payload: UpdateProductConfigRequest = {
      name: formData.name,
      summary: formData.summary,
      audience: formData.audience,
      problems: formData.problems.filter((p) => p.trim() !== ""),
      goals: formData.goals.filter((g) => g.trim() !== ""),
      differentiators: formData.differentiators.filter((d) => d.trim() !== ""),
      scope: formData.scope.filter((s) => s.trim() !== ""),
      constraints: formData.constraints.filter((c) => c.trim() !== ""),
      timeline: formData.timeline || undefined,
      successCriteria: formData.successCriteria.filter((s) => s.trim() !== ""),
      uniqueEdge: formData.uniqueEdge || undefined,
      techStack: formData.techStack.filter((t) => t.trim() !== ""),
      coreFeatures: formData.coreFeatures.filter((f) => f.trim() !== ""),
    };

    try {
      await onSave(payload);
      setSuccessMessage("プロダクト設定を保存しました");
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : "保存に失敗しました" });
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setSuccessMessage(null);

    try {
      await onReset();
      setSuccessMessage("デフォルト設定に戻しました");
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : "リセットに失敗しました" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">プロダクト設定</h2>
          <p className="text-sm text-slate-600 mt-1">
            全シナリオで使用するプロダクト/プロジェクト情報を設定します
          </p>
        </div>
        {productConfig?.isDefault === false && (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            カスタム設定中
          </span>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* Form Error */}
      {errors._form && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {errors._form}
        </div>
      )}

      {/* Form */}
      <FormSection title="基本情報" description="プロダクトの基本的な情報">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                プロダクト名 <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="例: 在庫最適化ダッシュボード"
                className="input-base"
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="audience" className="text-sm font-medium text-slate-700">
                ターゲットユーザー <span className="text-rose-500">*</span>
              </label>
              <input
                id="audience"
                type="text"
                value={formData.audience}
                onChange={(e) => handleFieldChange("audience", e.target.value)}
                placeholder="例: 店舗マネージャー、在庫管理担当"
                className="input-base"
              />
              {errors.audience && <p className="text-xs text-rose-600">{errors.audience}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="summary" className="text-sm font-medium text-slate-700">
              概要 <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleFieldChange("summary", e.target.value)}
              placeholder="プロダクトの概要を記載..."
              className="input-base min-h-[80px]"
              rows={3}
            />
            {errors.summary && <p className="text-xs text-rose-600">{errors.summary}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="timeline" className="text-sm font-medium text-slate-700">
              タイムライン
            </label>
            <input
              id="timeline"
              type="text"
              value={formData.timeline}
              onChange={(e) => handleFieldChange("timeline", e.target.value)}
              placeholder="例: 今四半期にβ、次四半期に正式版"
              className="input-base"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="詳細情報" description="課題、目標、制約などの詳細">
        <div className="space-y-4">
          <ArrayFieldManager
            label="課題・問題点 *"
            values={formData.problems}
            onChange={(v) => handleFieldChange("problems", v)}
            placeholder="解決すべき課題..."
            error={errors.problems}
          />

          <ArrayFieldManager
            label="目標 *"
            values={formData.goals}
            onChange={(v) => handleFieldChange("goals", v)}
            placeholder="達成目標..."
            error={errors.goals}
          />

          <ArrayFieldManager
            label="差別化要素"
            values={formData.differentiators.length > 0 ? formData.differentiators : [""]}
            onChange={(v) => handleFieldChange("differentiators", v)}
            placeholder="競合との違い..."
            minItems={0}
          />

          <ArrayFieldManager
            label="スコープ"
            values={formData.scope.length > 0 ? formData.scope : [""]}
            onChange={(v) => handleFieldChange("scope", v)}
            placeholder="対象範囲..."
            minItems={0}
          />

          <ArrayFieldManager
            label="制約"
            values={formData.constraints.length > 0 ? formData.constraints : [""]}
            onChange={(v) => handleFieldChange("constraints", v)}
            placeholder="制約条件..."
            minItems={0}
          />

          <ArrayFieldManager
            label="成功基準"
            values={formData.successCriteria.length > 0 ? formData.successCriteria : [""]}
            onChange={(v) => handleFieldChange("successCriteria", v)}
            placeholder="成功の指標..."
            minItems={0}
          />
        </div>
      </FormSection>

      <FormSection title="オプション情報" description="技術スタックや機能の詳細">
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="uniqueEdge" className="text-sm font-medium text-slate-700">
              独自の強み
            </label>
            <input
              id="uniqueEdge"
              type="text"
              value={formData.uniqueEdge}
              onChange={(e) => handleFieldChange("uniqueEdge", e.target.value)}
              placeholder="例: 現場が5分で意思決定できるシンプルUI"
              className="input-base"
            />
          </div>

          <ArrayFieldManager
            label="技術スタック"
            values={formData.techStack.length > 0 ? formData.techStack : [""]}
            onChange={(v) => handleFieldChange("techStack", v)}
            placeholder="使用技術..."
            minItems={0}
          />

          <ArrayFieldManager
            label="コア機能"
            values={formData.coreFeatures.length > 0 ? formData.coreFeatures : [""]}
            onChange={(v) => handleFieldChange("coreFeatures", v)}
            placeholder="主要機能..."
            minItems={0}
          />
        </div>
      </FormSection>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting || (productConfig?.isDefault ?? true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          デフォルトに戻す
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !isDirty}
          className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "保存中..." : "変更を保存"}
        </button>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">設定をリセット</h3>
            <p className="mt-2 text-sm text-slate-600">
              プロダクト設定をデフォルトに戻しますか？この操作は元に戻せません。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isResetting ? "リセット中..." : "リセット"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductConfigForm() {
  const { data: productConfig, isLoading, error } = useProductConfig();
  const updateMutation = useUpdateProductConfig();
  const resetMutation = useResetProductConfig();

  // Generate a key that changes when productConfig changes
  const formKey = useMemo(() => {
    if (!productConfig) return "loading";
    return `${productConfig.id ?? "default"}-${productConfig.updatedAt ?? "initial"}`;
  }, [productConfig]);

  const initialData = useMemo(() => toFormData(productConfig), [productConfig]);

  const handleSave = useCallback(async (payload: UpdateProductConfigRequest) => {
    await updateMutation.mutateAsync(payload);
  }, [updateMutation]);

  const handleReset = useCallback(async () => {
    await resetMutation.mutateAsync();
  }, [resetMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
          <p className="text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
        <p className="font-medium">エラーが発生しました</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <ProductConfigFormInner
      key={formKey}
      initialData={initialData}
      productConfig={productConfig}
      onSave={handleSave}
      onReset={handleReset}
      isSaving={updateMutation.isPending}
      isResetting={resetMutation.isPending}
    />
  );
}
