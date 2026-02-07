import { useEffect, useMemo, useState, type TextareaHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import { useProductConfig, useResetProductConfig, useUpdateProductConfig } from "@/queries/productConfig";
import { invalidateProductPromptCache } from "@/services/sessions";
import type { ProductConfig, UpdateProductConfigRequest } from "@/types";

const promptVariables = [
  { token: "{{scenarioTitle}}", description: "シナリオ名" },
  { token: "{{scenarioDescription}}", description: "シナリオの説明文" },
  { token: "{{scenarioDiscipline}}", description: "シナリオ種別 (BASIC/CHALLENGE)" },
  { token: "{{productName}}", description: "プロダクト名" },
  { token: "{{productSummary}}", description: "プロダクト概要" },
  { token: "{{productAudience}}", description: "想定ユーザー" },
];

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
  ...overrides,
});

export function SettingsPage() {
  const { data, isLoading, isError, error } = useProductConfig();
  const updateMutation = useUpdateProductConfig();
  const resetMutation = useResetProductConfig();
  const [prompt, setPrompt] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setPrompt(data.productPrompt ?? "");
    }
  }, [data]);

  const isDirty = useMemo(() => {
    return (data?.productPrompt ?? "") !== prompt;
  }, [data?.productPrompt, prompt]);

  const handleSave = async () => {
    if (!data) return;
    setSuccessMessage(null);
    setFormError(null);
    try {
      await updateMutation.mutateAsync(
        buildUpdatePayload(data, {
          productPrompt: prompt.trim() ? prompt.trim() : undefined,
        })
      );
      invalidateProductPromptCache();
      setSuccessMessage("プロジェクトプロンプトを保存しました");
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
      setPrompt(next.productPrompt ?? "");
      setSuccessMessage("デフォルトのプロンプトに戻しました");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "リセットに失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Settings</p>
        <h1 className="font-display text-2xl text-slate-900">プロジェクトプロンプト</h1>
        <p className="text-sm text-slate-600">
          すべてのシナリオが共通で参照するプロジェクトメモをMarkdownで管理できます。変数を使ってシナリオ固有の情報を差し込めます。
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

          <div className="space-y-2">
            <label htmlFor="productPrompt" className="text-sm font-semibold text-slate-800">
              プロジェクトメモ（Markdown / 変数対応）
            </label>
            <Textarea
              id="productPrompt"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setSuccessMessage(null);
              }}
              placeholder={"### 例\n- このプロジェクトの目的は...\n- 直近のリスクは..."}
              disabled={updateMutation.isPending || resetMutation.isPending}
            />
            <p className="text-xs text-slate-500">
              Markdownと以下の変数が利用できます。例: <code className="rounded bg-slate-100 px-1">顧客: {"{{productAudience}}"}</code>
            </p>
            <ul className="flex flex-wrap gap-2 text-xs">
              {promptVariables.map((variable) => (
                <li key={variable.token} className="rounded-full border border-slate-200 px-3 py-1 bg-slate-50 text-slate-600">
                  <span className="font-mono text-[11px] text-slate-700">{variable.token}</span>
                  <span className="ml-1 text-slate-500">{variable.description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live Preview</p>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                <ReactMarkdown className="markdown-preview text-sm text-slate-800">
                  {prompt.trim() ? prompt : "_プロンプトが未設定です_"}
                </ReactMarkdown>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">利用ヒント</p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>・ プロジェクトの背景、今期のフォーカス、評価観点などを書いておくと各シナリオで共有されます。</li>
                <li>・ シナリオ固有の情報は変数で差し込み可能です。</li>
                <li>・ 設定後は新しいチャット・評価から反映されます。</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
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
      className={`input-base min-h-[160px] font-mono text-sm leading-relaxed ${className}`}
      spellCheck={false}
      {...props}
    />
  );
}
