"use client";

import { ActionLog } from "@/components/ActionLog";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatStream } from "@/components/ChatStream";
import { ContextPanel } from "@/components/ContextPanel";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { ProgressTracker } from "@/components/ProgressTracker";
import { SessionControls } from "@/components/SessionControls";
import { evaluate, resumeSession, sendMessage, startSession, updateProgress } from "@/services/sessions";
import { useEffect, useState } from "react";

export default function ScenarioPage() {
  const [state, setState] = useState(() => resumeSession());
  const [loadingEval, setLoadingEval] = useState(false);

  const hasActive = !!state?.session;
  const evaluationReady =
    !!state?.session &&
    state.session.progressFlags.requirements &&
    state.session.progressFlags.priorities &&
    state.session.progressFlags.risks &&
    state.session.progressFlags.acceptance;

  const handleStart = async () => {
    const snapshot = await startSession("olivia-attendance");
    setState(snapshot);
  };

  const handleResume = async () => {
    const snapshot = resumeSession();
    setState(snapshot);
  };

  const handleReset = async () => {
    if (state?.session) {
      const confirmed = window.confirm("セッションをリセットしますか？");
      if (!confirmed) return;
      setState(null);
    }
  };

  const handleSend = async (content: string) => {
    if (!state) return;
    const next = await sendMessage(state, "user", content);
    setState(next);
  };

  const handleEvaluate = async () => {
    if (!state) return;
    setLoadingEval(true);
    const next = await evaluate(state);
    setState(next);
    setLoadingEval(false);
  };

  const handleUpdateTags = (messageId: string, tags: string[]) => {
    if (!state) return;
    const messages = state.messages.map((m) => (m.id === messageId ? { ...m, tags } : m));
    const next = { ...state, messages };
    setState(next);
  };

  const handleProgressComplete = () => {
    if (!state) return;
    const next = updateProgress(state, {
      requirements: true,
      priorities: true,
      risks: true,
      acceptance: true,
    });
    setState(next);
  };

  useEffect(() => {
    if (state) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void handleStart();
  }, [state]);

  const contextGoals = ["打刻漏れ削減", "モバイルからの打刻改善", "要件を6ヶ月で確定"];
  const contextProblems = ["旧勤怠システムの使いにくさ", "モバイル非対応", "打刻漏れが多い"];
  const contextConstraints = ["社内利用のみ", "セキュリティ遵守", "評価カテゴリを提示する"];
  const contextSuccess = ["評価4カテゴリで70点以上", "モバイル打刻成功率向上", "リスクと前提の明文化"];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
      <div className="order-2 space-y-4 lg:order-1">
        <ContextPanel
          audience="社内従業員・マネージャー"
          goals={contextGoals}
          problems={contextProblems}
          constraints={contextConstraints}
          timeline="6ヶ月以内に社内展開"
          successCriteria={contextSuccess}
        />
        <ProgressTracker
          requirements={state?.session.progressFlags.requirements ?? false}
          priorities={state?.session.progressFlags.priorities ?? false}
          risks={state?.session.progressFlags.risks ?? false}
          acceptance={state?.session.progressFlags.acceptance ?? false}
          onComplete={handleProgressComplete}
          disabled={!state}
        />
      </div>
      <div className="order-1 space-y-4 lg:order-2">
        <SessionControls
          hasActive={hasActive}
          onStart={handleStart}
          onResume={handleResume}
          onReset={handleReset}
          onEvaluate={handleEvaluate}
          evaluationReady={evaluationReady}
        />
        <ChatStream messages={state?.messages ?? []} />
        <ChatComposer
          onSend={handleSend}
          disabled={!hasActive}
          quickPrompts={["現状の打刻課題を整理してください", "リスクと前提をリスト化してください"]}
        />
        <EvaluationPanel evaluation={state?.evaluation} loading={loadingEval} />
        <ActionLog messages={state?.messages ?? []} onUpdateTags={handleUpdateTags} />
      </div>
    </div>
  );
}
