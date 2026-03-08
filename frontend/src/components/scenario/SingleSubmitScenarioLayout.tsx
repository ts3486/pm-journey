import { useState } from "react";
import type { Scenario } from "@/types";
import { MeetingLogViewer } from "@/components/scenario/MeetingLogViewer";
import { addOutput } from "@/services/outputs";
import type { SessionState } from "@/services/sessions";

type SingleSubmitScenarioLayoutProps = {
  scenario: Scenario;
  state: SessionState | null;
  sessionId?: string;
  onComplete: () => void;
  onReset: () => void;
  onOpenGuide?: () => void;
};

export function SingleSubmitScenarioLayout({
  scenario,
  state,
  sessionId,
  onComplete,
  onReset,
  onOpenGuide,
}: SingleSubmitScenarioLayoutProps) {
  const hasActive = Boolean(state?.session);
  const [formValue, setFormValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = formValue.trim() !== "";

  const isMeetingMinutes = scenario.id === "basic-meeting-minutes";

  const handleSubmit = async () => {
    if (!sessionId || !canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addOutput(sessionId, "text", formValue.trim(), "single-submit");
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                SOFT SKILLS Scenario
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

      {/* Instructions */}
      <div className="card border-orange-200/60 p-4">
        <h3 className="mb-2 text-sm font-semibold text-orange-700">
          ミッション
        </h3>
        <p className="text-sm leading-relaxed text-slate-700">
          {scenario.kickoffPrompt}
        </p>
      </div>

      {/* Meeting log (議事録 only) */}
      {isMeetingMinutes ? (
        <MeetingLogViewer
          src="/assets/ミーティングログ.txt"
          title="ミーティングログ"
        />
      ) : null}

      {/* Form + submit */}
      <div className="space-y-4">
        <div className="card p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">
              {isMeetingMinutes ? "議事録" : "自己紹介"}
            </span>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
              rows={12}
              placeholder={
                isMeetingMinutes
                  ? "ミーティングログを読み、議事録を作成してください。フォーマットは自由です。"
                  : "回答を入力してください"
              }
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              disabled={isSubmitting}
            />
          </label>
        </div>
        {hasActive && (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                {!canSubmit
                  ? "回答を入力してから提出してください"
                  : "回答を入力しました"}
              </p>
              <button
                type="button"
                className="btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "提出中..." : "回答を提出する"}
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
    </div>
  );
}
