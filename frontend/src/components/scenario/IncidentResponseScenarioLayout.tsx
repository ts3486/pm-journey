import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { Scenario } from "@/types";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import {
  IncidentResponseForm,
  serializeIncidentResponseForm,
  type IncidentResponseFormData,
} from "@/components/scenario/IncidentResponseForm";
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

type IncidentResponseScenarioLayoutProps = {
  scenario: Scenario;
  state: SessionState | null;
  sessionId?: string;
  awaitingReply: boolean;
  onSend: (content: string) => void;
  onComplete: () => void;
  onReset: () => void;
  onOpenGuide?: () => void;
};

const emptyForm: IncidentResponseFormData = {
  impactScope: "",
  initialResponse: "",
  stakeholderNotice: "",
  rootCausePrevention: "",
};

const quickPrompts = [
  "影響範囲の確認を手伝って",
  "エスカレーション先を整理したい",
  "初回報告のドラフトをレビューして",
];

export function IncidentResponseScenarioLayout({
  scenario,
  state,
  sessionId,
  awaitingReply,
  onSend,
  onComplete,
  onReset,
  onOpenGuide,
}: IncidentResponseScenarioLayoutProps) {
  const hasActive = Boolean(state?.session);
  const [formValue, setFormValue] = useState<IncidentResponseFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const briefing = useMemo(() => {
    if (!scenario.scenarioGuide) return null;
    return parseBriefingSections(scenario.scenarioGuide, 2);
  }, [scenario.scenarioGuide]);

  const canSubmit =
    formValue.impactScope.trim() !== "" &&
    formValue.initialResponse.trim() !== "" &&
    formValue.stakeholderNotice.trim() !== "";

  const handleSubmit = async () => {
    if (!sessionId || !canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const serialized = serializeIncidentResponseForm(formValue);
      await addOutput(sessionId, "text", serialized, "incident-response");
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
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
                INCIDENT RESPONSE Scenario
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
        <div className="card border-red-200/60 p-4">
          <h3 className="mb-3 text-sm font-semibold text-red-700">
            障害ブリーフィング
          </h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {briefing.summary}
          </ReactMarkdown>
          {briefing.details ? (
            <details className="mt-3 rounded-lg border border-slate-200/60 bg-slate-50/50">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-slate-500 select-none hover:text-slate-700">
                詳細情報を表示（タイムライン・影響範囲・チーム情報）
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
            <IncidentResponseForm
              value={formValue}
              onChange={setFormValue}
              disabled={isSubmitting}
            />
          </div>
          {hasActive && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  {!canSubmit
                    ? "必須項目を記入してから提出してください"
                    : "障害対応レポートを記入しました"}
                </p>
                <button
                  type="button"
                  className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting
                    ? "提出中..."
                    : "障害対応レポートを提出する"}
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
        </div>
      </div>
    </div>
  );
}
