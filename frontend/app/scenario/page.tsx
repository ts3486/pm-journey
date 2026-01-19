"use client";

import { ActionLog } from "@/components/ActionLog";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatStream } from "@/components/ChatStream";
import { ContextPanel } from "@/components/ContextPanel";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import { ProgressTracker } from "@/components/ProgressTracker";
import { SessionControls } from "@/components/SessionControls";
import { defaultScenario, getScenarioById } from "@/config/scenarios";
import { evaluate, resetSession, resumeSession, sendMessage, startSession, type SessionState, updateProgress } from "@/services/sessions";
import { logEvent } from "@/services/telemetry";
import { storage } from "@/services/storage";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ScenarioPage() {
  const [state, setState] = useState<SessionState | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const searchParams = useSearchParams();
  const restart = searchParams.get("restart") === "1";

  const scenarioIdParam = searchParams.get("scenarioId");
  const activeScenario = useMemo(() => {
    if (scenarioIdParam) return getScenarioById(scenarioIdParam) ?? defaultScenario;
    if (state?.session?.scenarioId) return getScenarioById(state.session.scenarioId) ?? defaultScenario;
    return defaultScenario;
  }, [scenarioIdParam, state?.session?.scenarioId]);

  const hasActive = !!state?.session;
  const evaluationReady =
    !!state?.session &&
    state.session.progressFlags.requirements &&
    state.session.progressFlags.priorities &&
    state.session.progressFlags.risks &&
    state.session.progressFlags.acceptance &&
    !state.offline;

  const handleStart = async (scenario = activeScenario) => {
    const snapshot = await startSession(scenario.id, scenario.discipline, scenario.kickoffPrompt);
    setState({ ...snapshot, session: { ...snapshot.session, scenarioDiscipline: scenario.discipline } });
    setCanResume(true);
    logEvent({
      type: "session_start",
      sessionId: snapshot.session.id,
      scenarioId: scenario.id,
      scenarioDiscipline: scenario.discipline,
    });
  };

  const handleResume = async (scenarioId?: string) => {
    const snapshot = resumeSession(scenarioId ?? activeScenario.id);
    if (snapshot) {
      setState(snapshot);
      setCanResume(true);
      logEvent({
        type: "session_resume",
        sessionId: snapshot.session.id,
        scenarioId: snapshot.session.scenarioId,
        scenarioDiscipline: snapshot.session.scenarioDiscipline,
      });
    }
  };

  const handleReset = async () => {
    if (state?.session) {
      const confirmed = window.confirm("セッションをリセットしますか？");
      if (!confirmed) return;
      resetSession(state.session.id, state.session.scenarioId);
      setState(null);
      setCanResume(false);
      logEvent({
        type: "session_reset",
        sessionId: state.session.id,
        scenarioId: state.session.scenarioId,
        scenarioDiscipline: state.session.scenarioDiscipline,
      });
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
    try {
      const next = await evaluate(state);
      setState(next);
      logEvent({
        type: "evaluation",
        sessionId: next.session.id,
        scenarioId: next.session.scenarioId,
        scenarioDiscipline: next.session.scenarioDiscipline,
        score: next.evaluation?.overallScore,
      });
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : "評価はオフライン時に実行できません。");
    } finally {
      setLoadingEval(false);
    }
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
    const targetScenario = getScenarioById(scenarioIdParam) ?? activeScenario ?? defaultScenario;
    if (!restart) {
      const existing = resumeSession(targetScenario.id);
      if (existing && !state) {
        setState(existing);
      } else if (!existing && !state) {
        void handleStart(targetScenario);
      }
    } else if (!state) {
      void handleStart(targetScenario);
    }
    setCanResume(!!storage.loadLastSessionId(targetScenario.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdParam, restart]);

  const contextGoals = activeScenario.product.goals;
  const contextProblems = activeScenario.product.problems;
  const contextConstraints = activeScenario.product.constraints;
  const contextSuccess = activeScenario.product.successCriteria;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
      <div className="order-2 space-y-4 lg:order-1">
        <ContextPanel
          audience={activeScenario.product.audience}
          goals={contextGoals}
          problems={contextProblems}
          constraints={contextConstraints}
          timeline={activeScenario.product.timeline}
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
        {state?.offline ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            オフラインのためメッセージはキューされます。評価はオンラインに戻ってから有効になります。
          </div>
        ) : null}
        <SessionControls
          hasActive={hasActive}
          canResume={canResume}
          onStart={() => void handleStart(activeScenario)}
          onResume={handleResume}
          onReset={handleReset}
          onEvaluate={handleEvaluate}
          evaluationReady={evaluationReady}
          scenarioTitle={activeScenario.title}
          offline={state?.offline ?? false}
        />
        <ChatStream messages={state?.messages ?? []} />
        <ChatComposer
          onSend={handleSend}
          disabled={!hasActive}
          quickPrompts={[
            "現状の打刻課題を整理してください",
            "リスクと前提をリスト化してください",
            "評価基準に沿って方針をまとめてください",
          ]}
        />
        <EvaluationPanel evaluation={state?.evaluation} loading={loadingEval} />
        <ActionLog messages={state?.messages ?? []} onUpdateTags={handleUpdateTags} />
      </div>
    </div>
  );
}
