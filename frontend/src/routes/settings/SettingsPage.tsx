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

type PromptSectionKey =
  | "context"
  | "usersAndProblems"
  | "goalsAndSuccess"
  | "scopeAndFeatures"
  | "constraintsAndTimeline"
  | "differentiation";

type PromptSections = Record<PromptSectionKey, string>;

type PromptSectionConfig = {
  key: PromptSectionKey;
  heading: string;
  label: string;
  hint: string;
  placeholder: string;
  aliases: string[];
};

const promptSectionConfigs: PromptSectionConfig[] = [
  {
    key: "context",
    heading: "プロジェクト背景",
    label: "1. プロジェクト背景",
    hint: "product.name / product.summary / product.audience の前提をここにまとめます。",
    placeholder: "- このプロダクトが解く領域\n- 主な対象ユーザー\n- 今回の文脈",
    aliases: ["プロジェクトコンテキスト", "背景", "Project Context"],
  },
  {
    key: "usersAndProblems",
    heading: "対象ユーザーと課題",
    label: "2. 対象ユーザーと課題",
    hint: "product.audience / product.problems に対応する内容を書きます。",
    placeholder: "- 誰のどの課題が中心か\n- いま困っている業務や状況",
    aliases: ["ターゲットと課題", "Users & Problems"],
  },
  {
    key: "goalsAndSuccess",
    heading: "目標と成功条件",
    label: "3. 目標と成功条件",
    hint: "product.goals / product.successCriteria を中心に記載します。",
    placeholder: "- 何を達成したいか\n- 成功をどう判断するか",
    aliases: ["ゴールと成功条件", "Goals & Success"],
  },
  {
    key: "scopeAndFeatures",
    heading: "スコープと主要機能",
    label: "4. スコープと主要機能",
    hint: "product.scope / product.coreFeatures をざっくり整理します。",
    placeholder: "- 今回扱う範囲\n- 重要な機能や観点",
    aliases: ["範囲と機能", "Scope & Features"],
  },
  {
    key: "constraintsAndTimeline",
    heading: "制約とタイムライン",
    label: "5. 制約とタイムライン",
    hint: "product.constraints / product.timeline を簡潔に書きます。",
    placeholder: "- 守るべき制約\n- 期限やマイルストーン",
    aliases: ["制約とスケジュール", "Constraints & Timeline"],
  },
  {
    key: "differentiation",
    heading: "差別化ポイントと補足",
    label: "6. 差別化ポイントと補足",
    hint: "product.differentiators / product.uniqueEdge + 追加メモを記載します。",
    placeholder: "- 競合との差別化\n- 議論で重視したい追加情報",
    aliases: ["差別化要素", "補足", "Differentiation & Notes", "追加メモ"],
  },
];

const createEmptyPromptSections = (): PromptSections => ({
  context: "",
  usersAndProblems: "",
  goalsAndSuccess: "",
  scopeAndFeatures: "",
  constraintsAndTimeline: "",
  differentiation: "",
});

const normalizePrompt = (value?: string) => (value ?? "").trim();

const resolveSectionKey = (heading: string): PromptSectionKey | undefined => {
  const normalizedHeading = heading.trim().toLowerCase();
  return promptSectionConfigs.find(
    (section) =>
      section.heading.toLowerCase() === normalizedHeading ||
      section.aliases.some((alias) => alias.toLowerCase() === normalizedHeading)
  )?.key;
};

const parsePromptSections = (prompt: string): PromptSections => {
  const sections = createEmptyPromptSections();
  const buckets: Record<PromptSectionKey, string[]> = {
    context: [],
    usersAndProblems: [],
    goalsAndSuccess: [],
    scopeAndFeatures: [],
    constraintsAndTimeline: [],
    differentiation: [],
  };
  const fallbackLines: string[] = [];
  let currentSection: PromptSectionKey | null = null;

  for (const line of prompt.split(/\r?\n/)) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      const nextSection = resolveSectionKey(headingMatch[1]);
      if (nextSection) {
        currentSection = nextSection;
        continue;
      }
      currentSection = null;
      fallbackLines.push(line);
      continue;
    }

    if (currentSection) {
      buckets[currentSection].push(line);
      continue;
    }
    fallbackLines.push(line);
  }

  for (const section of promptSectionConfigs) {
    sections[section.key] = buckets[section.key].join("\n").trim();
  }

  const fallback = fallbackLines.join("\n").trim();
  if (fallback) {
    sections.differentiation = sections.differentiation
      ? `${sections.differentiation}\n\n${fallback}`.trim()
      : fallback;
  }

  return sections;
};

const buildPromptFromSections = (sections: PromptSections): string =>
  promptSectionConfigs
    .map((section) => {
      const body = sections[section.key].trim();
      if (!body) return null;
      return `## ${section.heading}\n${body}`;
    })
    .filter((section): section is string => Boolean(section))
    .join("\n\n");

const listToBullets = (items: string[]) => items.filter((item) => item.trim().length > 0).map((item) => `- ${item}`).join("\n");

const buildDefaultSectionsFromConfig = (config: ProductConfig): PromptSections => ({
  context: [`- プロダクト名: ${config.name}`, `- 概要: ${config.summary}`].join("\n"),
  usersAndProblems: [`- 対象ユーザー: ${config.audience}`, listToBullets(config.problems)].filter(Boolean).join("\n"),
  goalsAndSuccess: [listToBullets(config.goals), listToBullets(config.successCriteria)].filter(Boolean).join("\n"),
  scopeAndFeatures: [listToBullets(config.scope), listToBullets(config.coreFeatures)].filter(Boolean).join("\n"),
  constraintsAndTimeline: [
    config.timeline?.trim() ? `- タイムライン: ${config.timeline}` : "",
    listToBullets(config.constraints),
  ]
    .filter(Boolean)
    .join("\n"),
  differentiation: [
    listToBullets(config.differentiators),
    config.uniqueEdge?.trim() ? `- ユニークポイント: ${config.uniqueEdge}` : "",
  ]
    .filter(Boolean)
    .join("\n"),
});

const getInitialSections = (config: ProductConfig): PromptSections => {
  const savedPrompt = config.productPrompt?.trim();
  if (savedPrompt) {
    return parsePromptSections(savedPrompt);
  }
  return buildDefaultSectionsFromConfig(config);
};

const getBaselinePrompt = (config?: ProductConfig): string => {
  if (!config) return "";
  const savedPrompt = config.productPrompt?.trim();
  if (savedPrompt) return savedPrompt;
  return buildPromptFromSections(buildDefaultSectionsFromConfig(config)).trim();
};

export function SettingsPage() {
  const { data, isLoading, isError, error } = useProductConfig();
  const updateMutation = useUpdateProductConfig();
  const resetMutation = useResetProductConfig();
  const [sections, setSections] = useState<PromptSections>(createEmptyPromptSections);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setSections(getInitialSections(data));
    }
  }, [data]);

  const prompt = useMemo(() => buildPromptFromSections(sections), [sections]);

  const isDirty = useMemo(() => {
    return normalizePrompt(getBaselinePrompt(data)) !== normalizePrompt(prompt);
  }, [data, prompt]);

  const handleSave = async () => {
    if (!data) return;
    setSuccessMessage(null);
    setFormError(null);
    try {
      const next = await updateMutation.mutateAsync(
        buildUpdatePayload(data, {
          productPrompt: prompt.trim() ? prompt.trim() : undefined,
        })
      );
      invalidateProductPromptCache();
      setSections(getInitialSections(next));
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
      setSections(getInitialSections(next));
      setSuccessMessage("デフォルトのプロンプトに戻しました");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "リセットに失敗しました");
    }
  };

  const updateSection = (key: PromptSectionKey, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }));
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

          <div className="grid gap-4 lg:grid-cols-2">
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
