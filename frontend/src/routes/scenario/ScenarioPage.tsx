import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { defaultScenario, getScenarioById } from "@/config";
import type { Scenario } from "@/types";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import { ProjectOverviewSection } from "@/components/scenario/ProjectOverviewSection";
import { TestCaseScenarioLayout } from "@/components/scenario/TestCaseScenarioLayout";
import {
  createLocalMessage,
  resetSession,
  resumeSession,
  sendMessage,
  startSession,
  updateMissionStatus,
  type SessionState,
} from "@/services/sessions";
import { logEvent } from "@/services/telemetry";

export function ScenarioPage() {
  const [state, setState] = useState<SessionState | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const pendingInitialReplyTimeout = useRef<number | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restart = searchParams.get("restart") === "1";
  const scenarioIdParam = searchParams.get("scenarioId");

  const activeScenario = useMemo<Scenario>(() => {
    if (scenarioIdParam) return getScenarioById(scenarioIdParam) ?? defaultScenario;
    if (state?.session?.scenarioId) return getScenarioById(state.session.scenarioId) ?? defaultScenario;
    return defaultScenario;
  }, [scenarioIdParam, state?.session?.scenarioId]);

  const hasActive = Boolean(state?.session);
  const messages = state?.messages ?? [];
  const missions = activeScenario.missions ?? [];
  const missionStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (state?.session.missionStatus ?? []).forEach((mission) => map.set(mission.missionId, true));
    return map;
  }, [state?.session?.missionStatus]);
  const isBasicScenario = activeScenario.scenarioType === "basic";
  const agentResponseEnabled = activeScenario.behavior?.agentResponseEnabled ?? true;
  const firstUserMessageIndex = messages.findIndex((message) => message.role === "user");
  const hasUserResponse = firstUserMessageIndex >= 0;
  const postUserMessages = firstUserMessageIndex >= 0 ? messages.slice(firstUserMessageIndex + 1) : [];
  const hasAgentResponseAfterUser = postUserMessages.some((message) => message.role === "agent");
  const hasSystemEndMessageAfterUser = postUserMessages.some((message) => message.role === "system");
  const basicScenarioEnded =
    isBasicScenario &&
    hasSystemEndMessageAfterUser &&
    (!agentResponseEnabled || hasAgentResponseAfterUser);
  const allMissionsComplete = missions.length > 0 && missions.every((mission) => missionStatusMap.get(mission.id));
  const requiresMissionCompletion = missions.length > 0;
  const canCompleteScenario =
    hasActive &&
    hasUserResponse &&
    (!requiresMissionCompletion || allMissionsComplete) &&
    (!isBasicScenario || basicScenarioEnded);
  const scenarioLocked = isBasicScenario && basicScenarioEnded;

  const clearPendingInitialReply = () => {
    if (pendingInitialReplyTimeout.current !== null) {
      window.clearTimeout(pendingInitialReplyTimeout.current);
      pendingInitialReplyTimeout.current = null;
    }
  };

  const handleStart = async (scenario = activeScenario) => {
    clearPendingInitialReply();
    setAwaitingReply(false);
    const snapshot = await startSession(scenario);
    const seededState = {
      ...snapshot,
      session: { ...snapshot.session, scenarioDiscipline: scenario.discipline },
    };
    const isBasic = scenario.scenarioType === "basic";
    const kickoff = snapshot.messages[0];
    const opening = snapshot.messages[1];
    const shouldDelayInitialOpening = isBasic && kickoff?.role === "system" && opening?.role === "agent";

    if (shouldDelayInitialOpening) {
      const initialMessages = snapshot.messages.filter((message) => message.id !== opening.id);
      setState({ ...seededState, messages: initialMessages });
      setAwaitingReply(true);
      const delayMs = Math.floor(700 + Math.random() * 500);
      pendingInitialReplyTimeout.current = window.setTimeout(() => {
        setState((current) => {
          if (!current || current.session.id !== seededState.session.id) return current;
          const alreadyDisplayed = current.messages.some((message) => message.id === opening.id);
          if (alreadyDisplayed) return current;
          return { ...current, messages: [...current.messages, opening] };
        });
        setAwaitingReply(false);
        pendingInitialReplyTimeout.current = null;
      }, delayMs);
    } else {
      setState(seededState);
    }
    logEvent({
      type: "session_start",
      sessionId: snapshot.session.id,
      scenarioId: scenario.id,
      scenarioDiscipline: scenario.discipline,
    });
  };

  const handleReset = async () => {
    if (!state?.session) return;
    const confirmed = window.confirm("このシナリオのセッションを終了して新しく始めますか？");
    if (!confirmed) return;
    clearPendingInitialReply();
    await resetSession(state.session.id, state.session.scenarioId);
    setState(null);
    setAwaitingReply(false);
    logEvent({
      type: "session_reset",
      sessionId: state.session.id,
      scenarioId: state.session.scenarioId,
      scenarioDiscipline: state.session.scenarioDiscipline,
    });
  };

  const handleMissionToggle = async (missionId: string, completed: boolean) => {
    if (!state) return;
    const next = await updateMissionStatus(state, missionId, completed);
    setState(next);
  };

  const handleSend = async (content: string) => {
    if (!state) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    if (activeScenario.scenarioType === "basic") {
      const alreadyAnswered = state.messages.some((message) => message.role === "user");
      if (alreadyAnswered) return;
    }

    const optimisticMessage = createLocalMessage(state.session.id, "user", trimmed);
    const optimisticState: SessionState = {
      ...state,
      session: { ...state.session, lastActivityAt: optimisticMessage.createdAt },
      messages: [...state.messages, optimisticMessage],
    };
    setState(optimisticState);
    setAwaitingReply(true);
    try {
      const next = await sendMessage(optimisticState, "user", trimmed, undefined, {
        existingMessage: optimisticMessage,
      });
      setState(next);
    } finally {
      setAwaitingReply(false);
    }
  };

  const handleCompleteScenario = async () => {
    if (!state) return;
    navigate(`/history/${state.session.id}?autoEvaluate=1`);
  };

  useEffect(() => {
    async function initializeSession() {
      const targetScenario = getScenarioById(scenarioIdParam) ?? activeScenario ?? defaultScenario;
      if (!restart) {
        const existing = await resumeSession(targetScenario.id);
        if (existing && !state) {
          if (existing.session.status === "evaluated" || existing.session.status === "completed") {
            void handleStart(targetScenario);
          } else {
            setState(existing);
            logEvent({
              type: "session_resume",
              sessionId: existing.session.id,
              scenarioId: existing.session.scenarioId,
              scenarioDiscipline: existing.session.scenarioDiscipline,
            });
          }
        } else if (!existing && !state) {
          void handleStart(targetScenario);
        }
      } else if (!state) {
        void handleStart(targetScenario);
      }
    }
    void initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdParam, restart]);

  useEffect(() => {
    return () => {
      if (pendingInitialReplyTimeout.current !== null) {
        window.clearTimeout(pendingInitialReplyTimeout.current);
        pendingInitialReplyTimeout.current = null;
      }
    };
  }, []);

  if (activeScenario.scenarioType === "test-case") {
    return (
      <TestCaseScenarioLayout
        scenario={activeScenario}
        state={state}
        onComplete={handleCompleteScenario}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {activeScenario.discipline} Scenario
              </p>
              <h1 className="font-display text-2xl text-slate-900">{activeScenario.title}</h1>
              <p className="text-sm text-slate-600">{activeScenario.description}</p>
            </div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ChatStream messages={state?.messages ?? []} maxHeight="60vh" isTyping={awaitingReply} />
          <ChatComposer
            onSend={handleSend}
            disabled={!hasActive || scenarioLocked || awaitingReply}
          />
          {scenarioLocked ? (
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
              ベーシックシナリオは1回の回答で終了します。右側の「シナリオを完了する」ボタンから評価を依頼してください。
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">ミッション</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {missions.length === 0 ? (
                <li className="text-xs text-slate-500">設定されたミッションはありません。</li>
              ) : (
                missions
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((mission) => {
                    const done = missionStatusMap.get(mission.id) ?? false;
                    return (
                      <li key={mission.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200/70 px-3 py-2">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            checked={done}
                            name={`mission-${mission.id}`}
                            onChange={(event) => handleMissionToggle(mission.id, event.target.checked)}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{mission.title}</p>
                            {mission.description ? (
                              <p className="text-xs text-slate-600">{mission.description}</p>
                            ) : null}
                          </div>
                        </label>
                      </li>
                    );
                  })
              )}
            </ul>
          </div>

          <div className="card-muted px-4 py-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {allMissionsComplete ? "ミッション達成" : "評価を実行"}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCompleteScenario}
                disabled={!canCompleteScenario}
              >
                シナリオを完了する
              </button>
            </div>
            {!hasUserResponse ? (
              <p className="mt-2 text-xs text-slate-500">評価を開始するには、先に1件以上メッセージを送信してください。</p>
            ) : null}
            {hasUserResponse && isBasicScenario && !basicScenarioEnded ? (
              <p className="mt-2 text-xs text-slate-500">
                エージェントの返答とシナリオ終了メッセージの表示を待ってから完了してください。
              </p>
            ) : null}
            {hasUserResponse && requiresMissionCompletion && !allMissionsComplete ? (
              <p className="mt-2 text-xs text-slate-500">
                エージェントがミッション達成を判定すると自動でチェックされます。必要であれば手動でチェックして完了できます。
              </p>
            ) : null}
          </div>
          <ProjectOverviewSection scenario={activeScenario} />

          {hasActive ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-slate-400 transition hover:text-slate-600"
                onClick={handleReset}
                aria-label="セッションをリセット"
                title="セッションをリセット"
              >
                セッションをリセット
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
