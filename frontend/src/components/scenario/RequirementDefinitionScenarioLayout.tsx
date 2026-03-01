import { useState } from "react";
import type { Scenario } from "@/types";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import {
  FileUploadMockup,
  FormMockup,
  LoginMockup,
  NotificationSettingsMockup,
  PasswordResetMockup,
  ProfileEditMockup,
  SearchFilterMockup,
} from "@/components/mockups";
import { RequirementDefinitionForm } from "@/components/scenario/RequirementDefinitionForm";
import { addOutput } from "@/services/outputs";
import type { SessionState } from "@/services/sessions";

type RequirementDefinitionScenarioLayoutProps = {
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
  "要件の曖昧な部分を整理したい",
  "受入条件を具体化したい",
  "エッジケースの洗い出しを手伝って",
];

export function RequirementDefinitionScenarioLayout({
  scenario,
  state,
  sessionId,
  awaitingReply,
  onSend,
  onComplete,
  onReset,
  onOpenGuide,
}: RequirementDefinitionScenarioLayoutProps) {
  const hasActive = Boolean(state?.session);
  const mockupComponent = scenario.featureMockup?.component;
  const [formValue, setFormValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = formValue.trim() !== "";

  const handleSubmit = async () => {
    if (!sessionId || !canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addOutput(sessionId, "text", formValue.trim(), "requirement-definition");
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMockup = () => {
    const description = scenario.featureMockup?.description;
    switch (mockupComponent) {
      case "login":
        return <LoginMockup description={description} />;
      case "form":
        return <FormMockup description={description} />;
      case "file-upload":
        return <FileUploadMockup description={description} />;
      case "password-reset":
        return <PasswordResetMockup description={description} />;
      case "search-filter":
        return <SearchFilterMockup description={description} />;
      case "notification-settings":
        return <NotificationSettingsMockup description={description} />;
      case "profile-edit":
        return <ProfileEditMockup description={description} />;
      default:
        return (
          <div className="rounded-lg bg-gray-100 p-8 text-center text-gray-500">
            デザインが設定されていません
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">REQUIREMENT DEFINITION Scenario</p>
              <h1 className="font-display text-2xl text-slate-900">{scenario.title}</h1>
              <p className="max-w-2xl text-sm text-slate-600">{scenario.description}</p>
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

      <div className="card p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">機能デザイン</h3>
        <div className="p-4">{renderMockup()}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column: requirement definition form + actions */}
        <div className="space-y-4">
          <div className="card p-4">
            <RequirementDefinitionForm
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
                    ? "要件定義を記入してから提出してください"
                    : "要件定義を記入しました"}
                </p>
                <button
                  type="button"
                  className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? "提出中..." : "要件定義を提出する"}
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

        {/* Right column: AI chat panel */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">AIアシスタント</h3>
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
