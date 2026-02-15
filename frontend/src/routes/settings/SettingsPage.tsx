import { useEffect, useMemo, useState, type TextareaHTMLAttributes } from "react";
import {
  buildPromptFromSections,
  createEmptyPromptSections,
  getBaselinePrompt,
  getInitialSections,
  normalizePrompt,
  promptSectionConfigs,
  type PromptSectionKey,
  type PromptSections,
} from "@/lib/productPromptSections";
import {
  createDefaultScenarioEvaluationCriteriaConfig,
  normalizeScenarioEvaluationCriteriaConfig,
  parseScenarioCriteriaTextareaValue,
  scenarioCriteriaListToTextareaValue,
  scenarioEvaluationCategorySections,
  serializeScenarioEvaluationCriteriaConfig,
  type ScenarioEvaluationCategoryKey,
} from "@/lib/scenarioEvaluationCriteria";
import { useProductConfig, useResetProductConfig, useUpdateProductConfig } from "@/queries/productConfig";
import { invalidateProductPromptCache } from "@/services/sessions";
import type {
  ProductConfig,
  ScenarioEvaluationCriteriaConfig,
  UpdateProductConfigRequest,
} from "@/types";

const buildUpdatePayload = (
  config: ProductConfig,
  overrides: Partial<UpdateProductConfigRequest>
): UpdateProductConfigRequest => ({
  name: config.name,
  summary: config.summary,
  audience: config.audience,
  problems: config.problems ?? [],
  goals: config.goals ?? [],
  differentiators: config.differentiators ?? [],
  scope: config.scope ?? [],
  constraints: config.constraints ?? [],
  timeline: config.timeline,
  successCriteria: config.successCriteria ?? [],
  uniqueEdge: config.uniqueEdge,
  techStack: config.techStack ?? [],
  coreFeatures: config.coreFeatures ?? [],
  scenarioEvaluationCriteria: normalizeScenarioEvaluationCriteriaConfig(config.scenarioEvaluationCriteria),
  ...overrides,
});

export function SettingsPage() {
  const { data, isLoading, isError, error } = useProductConfig();
  const updateMutation = useUpdateProductConfig();
  const resetMutation = useResetProductConfig();
  const [sections, setSections] = useState<PromptSections>(createEmptyPromptSections);
  const [scenarioEvaluationCriteria, setScenarioEvaluationCriteria] = useState<ScenarioEvaluationCriteriaConfig>(
    createDefaultScenarioEvaluationCriteriaConfig
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setSections(getInitialSections(data));
      setScenarioEvaluationCriteria(normalizeScenarioEvaluationCriteriaConfig(data.scenarioEvaluationCriteria));
    }
  }, [data]);

  const prompt = useMemo(() => buildPromptFromSections(sections), [sections]);

  const isDirty = useMemo(() => {
    const promptDirty = normalizePrompt(getBaselinePrompt(data)) !== normalizePrompt(prompt);
    const baselineCriteria = normalizeScenarioEvaluationCriteriaConfig(data?.scenarioEvaluationCriteria);
    const criteriaDirty =
      serializeScenarioEvaluationCriteriaConfig(baselineCriteria) !==
      serializeScenarioEvaluationCriteriaConfig(normalizeScenarioEvaluationCriteriaConfig(scenarioEvaluationCriteria));
    return promptDirty || criteriaDirty;
  }, [data, prompt, scenarioEvaluationCriteria]);

  const handleSave = async () => {
    if (!data) return;
    setSuccessMessage(null);
    setFormError(null);
    try {
      const normalizedCriteria = normalizeScenarioEvaluationCriteriaConfig(scenarioEvaluationCriteria);
      const next = await updateMutation.mutateAsync(
        buildUpdatePayload(data, {
          productPrompt: prompt.trim() ? prompt.trim() : undefined,
          scenarioEvaluationCriteria: normalizedCriteria,
        })
      );
      invalidateProductPromptCache();
      setSections(getInitialSections(next));
      setScenarioEvaluationCriteria(normalizeScenarioEvaluationCriteriaConfig(next.scenarioEvaluationCriteria));
      setSuccessMessage("プロンプト設定を保存しました");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "保存に失敗しました");
    }
  };

  const handleReset = async () => {
    setSuccessMessage(null);
    setFormError(null);
    try {
      const next = await resetMutation.mutateAsync();
      invalidateProductPromptCache();
      setSections(getInitialSections(next));
      setScenarioEvaluationCriteria(normalizeScenarioEvaluationCriteriaConfig(next.scenarioEvaluationCriteria));
      setSuccessMessage("デフォルト設定に戻しました");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "リセットに失敗しました");
    }
  };

  const updateSection = (key: PromptSectionKey, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }));
    setSuccessMessage(null);
  };

  const updateScenarioEvaluationCriteria = (key: ScenarioEvaluationCategoryKey, value: string) => {
    setScenarioEvaluationCriteria((prev) => ({
      ...prev,
      [key]: parseScenarioCriteriaTextareaValue(value),
    }));
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">プロンプト設定</p>
        <h1 className="font-display text-2xl text-slate-900">Prompt Settings</h1>
        <p className="text-sm text-slate-600">
          プロダクト設定スキーマに沿って入力欄を分け、全シナリオで共通利用するプロジェクト詳細のプロンプトを作成できます。。
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">読み込み中...</div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 p-6 text-sm text-rose-700">
          {error instanceof Error ? error.message : "設定の取得に失敗しました"}
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          設定が見つかりません。
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          {formError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            {promptSectionConfigs.map((section) => (
              <div key={section.key} className="flex flex-col gap-3">
                <label htmlFor={section.key} className="text-sm font-semibold text-slate-800">
                  {section.label}
                </label>
                <Textarea
                  id={section.key}
                  value={sections[section.key]}
                  onChange={(event) => updateSection(section.key, event.target.value)}
                  placeholder={section.placeholder}
                  className="min-h-30"
                  disabled={updateMutation.isPending || resetMutation.isPending}
                />
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">シナリオ評価基準（カテゴリ別）</p>
              <p className="text-sm text-slate-600">
                各カテゴリの評価観点を1行1項目で編集できます。空欄の場合はデフォルト基準を使用します。
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {scenarioEvaluationCategorySections.map((category) => (
                <div key={category.key} className="flex flex-col gap-2">
                  <label htmlFor={`criteria-${category.key}`} className="text-sm font-semibold text-slate-800">
                    {category.label}
                  </label>
                  <p className="text-xs text-slate-500">{category.hint}</p>
                  <Textarea
                    id={`criteria-${category.key}`}
                    value={scenarioCriteriaListToTextareaValue(scenarioEvaluationCriteria[category.key])}
                    onChange={(event) => updateScenarioEvaluationCriteria(category.key, event.target.value)}
                    placeholder={category.placeholder}
                    className="min-h-32"
                    disabled={updateMutation.isPending || resetMutation.isPending}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">利用ヒント</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>・ プロジェクトの背景、今期のフォーカス、評価観点などを書いておくと各シナリオで共有されます。</li>
                <li>・ シナリオ固有の情報は変数で差し込み可能です。</li>
                <li>・ 設定後は新しいチャット・評価から反映されます。</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-primary disabled:opacity-50"
              onClick={() => void handleSave()}
              disabled={!isDirty || updateMutation.isPending || resetMutation.isPending}
            >
              {updateMutation.isPending ? "保存中..." : "保存する"}
            </button>
            <button
              type="button"
              className="btn-secondary disabled:opacity-50"
              onClick={() => void handleReset()}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "リセット中..." : "デフォルトに戻す"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`input-base min-h-40 font-mono text-sm leading-relaxed ${className}`}
      spellCheck={false}
      {...props}
    />
  );
}
