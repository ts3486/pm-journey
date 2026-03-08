import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { Scenario } from "@/types";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import { ProjectOverviewSection } from "@/components/scenario/ProjectOverviewSection";
import { addOutput } from "@/services/outputs";
import type { SessionState } from "@/services/sessions";

function parseBriefingSections(guide: string, summaryCount: number) {
  const withoutH2 = guide.replace(/^##\s+[^\n]+\n*/m, "");
  const sections = withoutH2.split(/(?=^### )/m).filter((s) => s.trim());
  return {
    summary: sections.slice(0, summaryCount).join("\n"),
    details: sections.slice(summaryCount).join("\n"),
  };
}

const mdComponents: Components = {
  h3: ({ children }) => (
    <h4 className="mt-4 mb-2 text-sm font-bold text-slate-800">{children}</h4>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-slate-200 px-2 py-1.5 text-left text-xs font-semibold text-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 px-2 py-1.5 text-xs text-slate-600">
      {children}
    </td>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="text-sm text-slate-700">{children}</li>
  ),
  p: ({ children }) => (
    <p className="my-1.5 text-sm leading-relaxed text-slate-700">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
};

type PrdScenarioLayoutProps = {
  scenario: Scenario;
  state: SessionState | null;
  sessionId?: string;
  awaitingReply: boolean;
  onSend: (content: string) => void;
  onComplete: () => void;
  onReset: () => void;
  onOpenGuide?: () => void;
};

const quickPrompts = [
  "背景と目的の書き方を相談したい",
  "成功指標の設定を手伝って",
  "スコープの切り分けを整理したい",
];

export function PrdScenarioLayout({
  scenario,
  state,
  sessionId,
  awaitingReply,
  onSend,
  onComplete,
  onReset,
  onOpenGuide,
}: PrdScenarioLayoutProps) {
  const hasActive = Boolean(state?.session);
  const [formValue, setFormValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const briefing = useMemo(() => {
    const content = scenario.kickoffPrompt?.trim();
    if (!content) return null;
    return parseBriefingSections(content, 2);
  }, [scenario.kickoffPrompt]);

  const canSubmit = formValue.trim() !== "";

  const handleSubmit = async () => {
    if (!sessionId || !canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addOutput(sessionId, "text", formValue.trim(), "prd");
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
                PRD Scenario
              </p>
              <h1 className="font-display text-2xl text-slate-900">
                {scenario.title}
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                {scenario.description}
              </p>
            </div>
            {onOpenGuide ? (
              <button
                type="button"
                className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800"
                onClick={onOpenGuide}
              >
                シナリオガイドを見る
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {briefing ? (
        <div className="card border-blue-200/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-blue-700">
            シナリオブリーフィング
          </h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {briefing.summary}
          </ReactMarkdown>
          {briefing.details ? (
            <details className="mt-3 rounded-lg border border-slate-200/60 bg-slate-50/50">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-500 select-none hover:text-slate-700">
                詳細情報を表示
              </summary>
              <div className="border-t border-slate-200/60 px-3 py-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {briefing.details}
                </ReactMarkdown>
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="card p-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">PRD（製品要求文書）</h3>
              <textarea
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                disabled={isSubmitting}
                rows={20}
                placeholder={"例:\n## 背景と目的\nなぜこの機能が必要か、ビジネス課題は何か\n\n## 成功指標\n- KPI: 〇〇率を△%→□%に改善\n- 測定方法: ...\n- 達成期限: ...\n\n## スコープ\n### スコープ内\n- ...\n### スコープ外\n- ...\n\n## ユーザーストーリー\n- As a [ペルソナ], I want [行動], so that [価値]\n- ..."}
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          {hasActive && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  {!canSubmit
                    ? "PRDを記入してから提出してください"
                    : "PRDを記入しました"}
                </p>
                <button
                  type="button"
                  className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "提出中..." : "PRDを提出する"}
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-slate-400 transition hover:text-slate-600"
                  onClick={onReset}
                >
                  セッションをリセット
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              AIアシスタント
            </h3>
            <ChatStream
              messages={state?.messages ?? []}
              maxHeight="50vh"
              isTyping={awaitingReply}
            />
          </div>
          <ChatComposer
            onSend={onSend}
            disabled={!hasActive || awaitingReply}
            quickPrompts={quickPrompts}
          />
          <ProjectOverviewSection scenario={scenario} />
        </div>
      </div>
    </div>
  );
}
