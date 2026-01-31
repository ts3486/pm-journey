"use client";

import { ChatComposer } from "@/components/ChatComposer";
import { ChatStream } from "@/components/ChatStream";
import { TestCaseScenarioLayout } from "@/components/TestCaseScenarioLayout";
import { defaultScenario, getScenarioById } from "@/config/scenarios";
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
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

export default function ScenarioPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-4 text-sm text-slate-700">読み込み中…</div>
      }
    >
      <ScenarioContent />
    </Suspense>
  );
}

function ScenarioContent() {
  const [state, setState] = useState<SessionState | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const restart = searchParams.get("restart") === "1";
  const scenarioIdParam = searchParams.get("scenarioId");

  const activeScenario = useMemo(() => {
    if (scenarioIdParam) return getScenarioById(scenarioIdParam) ?? defaultScenario;
    if (state?.session?.scenarioId) return getScenarioById(state.session.scenarioId) ?? defaultScenario;
    return defaultScenario;
  }, [scenarioIdParam, state?.session?.scenarioId]);

  const hasActive = !!state?.session;
  const missions = activeScenario.missions ?? [];
  const missionStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (state?.session.missionStatus ?? []).forEach((m) => map.set(m.missionId, true));
    return map;
  }, [state?.session?.missionStatus]);
  const isBasicScenario = activeScenario.scenarioType === "basic";
  const hasUserResponse = (state?.messages ?? []).some((message) => message.role === "user");
  const scenarioLocked = isBasicScenario && hasUserResponse;
  const allMissionsComplete = missions.length > 0 && missions.every((m) => missionStatusMap.get(m.id));
  const scenarioInfo = activeScenario.product;
  const hasScenarioInfo =
    !!activeScenario.supplementalInfo ||
    !!scenarioInfo.summary ||
    !!scenarioInfo.audience ||
    (scenarioInfo.goals?.length ?? 0) > 0 ||
    (scenarioInfo.problems?.length ?? 0) > 0 ||
    (scenarioInfo.constraints?.length ?? 0) > 0 ||
    (scenarioInfo.successCriteria?.length ?? 0) > 0 ||
    !!scenarioInfo.timeline;

  const handleStart = async (scenario = activeScenario) => {
    const snapshot = await startSession(scenario.id, scenario.discipline, scenario.kickoffPrompt);
    setState({ ...snapshot, session: { ...snapshot.session, scenarioDiscipline: scenario.discipline } });
    logEvent({
      type: "session_start",
      sessionId: snapshot.session.id,
      scenarioId: scenario.id,
      scenarioDiscipline: scenario.discipline,
    });
  };

  const handleReset = async () => {
    if (state?.session) {
      const confirmed = window.confirm("このシナリオのセッションを終了して新しく始めますか？");
      if (!confirmed) return;
      await resetSession(state.session.id, state.session.scenarioId);
      setState(null);
      logEvent({
        type: "session_reset",
        sessionId: state.session.id,
        scenarioId: state.session.scenarioId,
        scenarioDiscipline: state.session.scenarioDiscipline,
      });
    }
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
    router.push(`/history/${state.session.id}?autoEvaluate=1`);
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
          }
        } else if (!existing && !state) {
          void handleStart(targetScenario);
        }
      } else if (!state) {
        void handleStart(targetScenario);
      }
    }
    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdParam, restart]);

  if (activeScenario.scenarioType === "test-case") {
    return (
      <TestCaseScenarioLayout
        scenario={activeScenario}
        state={state}
        awaitingReply={awaitingReply}
        onSend={handleSend}
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
              <p className="max-w-2xl text-sm text-slate-600">{activeScenario.description}</p>
            </div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ChatStream
            messages={state?.messages ?? []}
            maxHeight="60vh"
            isTyping={awaitingReply}
          />
          <ChatComposer
            onSend={handleSend}
            disabled={!hasActive || scenarioLocked}
            quickPrompts={[
              "現状と課題を整理してください",
              "前提を教えてください",
              "制約条件を教えてください",
            ]}
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
                            onChange={(e) => handleMissionToggle(mission.id, e.target.checked)}
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

          {allMissionsComplete ? (
            <div className="card-muted px-4 py-4 text-sm text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">ミッション達成</p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCompleteScenario}
                >
                  シナリオを完了する
                </button>
              </div>
            </div>
          ) : null}

          {hasScenarioInfo ? (
            <div className="card p-4">
              <p className="text-sm font-semibold text-slate-900 mb-4">背景・補足情報</p>
              <div className="space-y-3">
                {scenarioInfo.summary ? (
                  <div className="rounded-lg bg-slate-50/80 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px]">📋</span>
                      <span className="text-xs font-semibold text-slate-700">背景</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{scenarioInfo.summary}</p>
                  </div>
                ) : null}

                {scenarioInfo.audience ? (
                  <div className="rounded-lg bg-blue-50/60 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-[10px]">👥</span>
                      <span className="text-xs font-semibold text-blue-800">対象ユーザー</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{scenarioInfo.audience}</p>
                  </div>
                ) : null}

                {scenarioInfo.goals?.length ? (
                  <div className="rounded-lg bg-emerald-50/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-[10px]">🎯</span>
                      <span className="text-xs font-semibold text-emerald-800">ゴール</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scenarioInfo.goals.map((goal) => (
                        <li key={goal} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                          <span className="leading-relaxed">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {scenarioInfo.problems?.length ? (
                  <div className="rounded-lg bg-amber-50/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-[10px]">⚠️</span>
                      <span className="text-xs font-semibold text-amber-800">課題</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scenarioInfo.problems.map((problem) => (
                        <li key={problem} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          <span className="leading-relaxed">{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {scenarioInfo.constraints?.length ? (
                  <div className="rounded-lg bg-rose-50/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-100 text-[10px]">🚧</span>
                      <span className="text-xs font-semibold text-rose-800">制約条件</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scenarioInfo.constraints.map((constraint) => (
                        <li key={constraint} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                          <span className="leading-relaxed">{constraint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {scenarioInfo.timeline ? (
                  <div className="rounded-lg bg-violet-50/60 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-100 text-[10px]">📅</span>
                      <span className="text-xs font-semibold text-violet-800">タイムライン</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{scenarioInfo.timeline}</p>
                  </div>
                ) : null}

                {scenarioInfo.successCriteria?.length ? (
                  <div className="rounded-lg bg-teal-50/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-teal-100 text-[10px]">✅</span>
                      <span className="text-xs font-semibold text-teal-800">成功条件</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scenarioInfo.successCriteria.map((criterion) => (
                        <li key={criterion} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                          <span className="leading-relaxed">{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {activeScenario.supplementalInfo ? (
                  <div className="rounded-lg bg-slate-100/80 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px]">💡</span>
                      <span className="text-xs font-semibold text-slate-700">補足情報</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{activeScenario.supplementalInfo}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

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
