"use client";

import { ChatComposer } from "@/components/ChatComposer";
import { ChatStream } from "@/components/ChatStream";
import { defaultScenario, getScenarioById } from "@/config/scenarios";
import {
  evaluate,
  resetSession,
  resumeSession,
  sendMessage,
  startSession,
  updateMissionStatus,
  type SessionState,
} from "@/services/sessions";
import { logEvent } from "@/services/telemetry";
import { storage } from "@/services/storage";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

export default function ScenarioPage() {
  return (
    <Suspense
      fallback={
        <div className="card p-4 text-sm text-slate-700">読み込み中...</div>
      }
    >
      <ScenarioContent />
    </Suspense>
  );
}

function ScenarioContent() {
  const [state, setState] = useState<SessionState | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [lastSessionStatus, setLastSessionStatus] =
    useState<SessionState["session"]["status"] | null>(null);
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
  const evaluationReady =
    !!state?.session &&
    state.session.progressFlags.requirements &&
    state.session.progressFlags.priorities &&
    state.session.progressFlags.risks &&
    state.session.progressFlags.acceptance &&
    !state.offline;
  const missions = activeScenario.missions ?? [];
  const missionStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (state?.session.missionStatus ?? []).forEach((m) => map.set(m.missionId, true));
    return map;
  }, [state?.session?.missionStatus]);
  const allMissionsComplete = missions.length > 0 && missions.every((m) => missionStatusMap.get(m.id));
  const canResume =
    !!lastSessionId &&
    lastSessionId !== state?.session?.id &&
    (lastSessionStatus === "active" || lastSessionStatus === "completed");
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
    setLastSessionId(snapshot.session.id);
    setLastSessionStatus(snapshot.session.status);
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
      if (snapshot.session.status === "evaluated" || snapshot.session.status === "completed") {
        await handleStart(getScenarioById(snapshot.session.scenarioId) ?? activeScenario);
        return;
      }
      setState(snapshot);
      setLastSessionId(snapshot.session.id);
      setLastSessionStatus(snapshot.session.status);
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
      const confirmed = window.confirm("このシナリオのセッションを終了して新しく始めますか？");
      if (!confirmed) return;
      resetSession(state.session.id, state.session.scenarioId);
      setState(null);
      setLastSessionId(null);
      setLastSessionStatus(null);
      logEvent({
        type: "session_reset",
        sessionId: state.session.id,
        scenarioId: state.session.scenarioId,
        scenarioDiscipline: state.session.scenarioDiscipline,
      });
    }
  };

  const handleMissionToggle = (missionId: string, completed: boolean) => {
    if (!state) return;
    const next = updateMissionStatus(state, missionId, completed);
    setState(next);
  };

  const handleSend = async (content: string) => {
    if (!state) return;
    const next = await sendMessage(state, "user", content);
    setState(next);
  };

  const handleCompleteScenario = async () => {
    if (!state) return;
    await runEvalAndRedirect(state);
  };

  const runEvalAndRedirect = async (snapshot: SessionState, navigate = true) => {
    if (snapshot.offline) {
      alert("オンラインに戻ってから評価を実行してください。");
      return;
    }
    setLoadingEval(true);
    try {
      const next = await evaluate(snapshot);
      setState(next);
      logEvent({
        type: "evaluation",
        sessionId: next.session.id,
        scenarioId: next.session.scenarioId,
        scenarioDiscipline: next.session.scenarioDiscipline,
        score: next.evaluation?.overallScore,
      });
      if (navigate) {
        router.push(`/history/${next.session.id}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err instanceof Error ? err.message : "オンラインに戻ってから評価を実行してください。");
    } finally {
      setLoadingEval(false);
    }
  };

  useEffect(() => {
    const targetScenario = getScenarioById(scenarioIdParam) ?? activeScenario ?? defaultScenario;
    if (!restart) {
      const existing = resumeSession(targetScenario.id);
      if (existing && !state) {
        setLastSessionId(existing.session.id);
        setLastSessionStatus(existing.session.status);
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
    const storedId = storage.loadLastSessionId(targetScenario.id);
    if (!storedId) {
      setLastSessionId(null);
      setLastSessionStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIdParam, restart]);

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6 reveal">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative z-10 space-y-4">
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
          <ChatStream messages={state?.messages ?? []} maxHeight="60vh" />
          <ChatComposer
            onSend={handleSend}
            disabled={!hasActive}
            quickPrompts={[
              "現状の課題をまとめてください",
              "リスクと前提を洗い出してください",
              "次の打ち手を提案してください",
            ]}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">ミッション</p>
                <p className="text-[11px] text-slate-500">AIが会話内容から自動でチェックします。</p>
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
                      <li key={mission.id} className="flex items-start gap-2 rounded-xl border border-slate-200/70 px-3 py-2">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          checked={done}
                          onChange={(e) => handleMissionToggle(mission.id, e.target.checked)}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{mission.title}</p>
                          {mission.description ? (
                            <p className="text-xs text-slate-600">{mission.description}</p>
                          ) : null}
                        </div>
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
                  <p className="text-xs text-slate-600">完了するタイミングはあなたが決められます。</p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCompleteScenario}
                  disabled={!evaluationReady || state?.offline || loadingEval}
                >
                  シナリオを完了する
                </button>
              </div>
              {loadingEval ? (
                <p className="mt-2 text-xs text-slate-500">評価を実行しています…</p>
              ) : null}
            </div>
          ) : null}

          {hasScenarioInfo ? (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">背景・補足情報</p>
              </div>
              <details className="mt-3 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-xs text-slate-700">
                <summary className="cursor-pointer select-none font-semibold text-slate-800">
                  開く
                </summary>
                <div className="mt-2 space-y-2">
                  {scenarioInfo.summary ? (
                    <p>
                      <span className="font-semibold text-slate-800">背景:</span> {scenarioInfo.summary}
                    </p>
                  ) : null}
                  {scenarioInfo.audience ? (
                    <p>
                      <span className="font-semibold text-slate-800">対象:</span> {scenarioInfo.audience}
                    </p>
                  ) : null}
                  {scenarioInfo.goals?.length ? (
                    <div>
                      <p className="font-semibold text-slate-800">ゴール</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {scenarioInfo.goals.map((goal) => (
                          <li key={goal}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scenarioInfo.problems?.length ? (
                    <div>
                      <p className="font-semibold text-slate-800">課題</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {scenarioInfo.problems.map((problem) => (
                          <li key={problem}>{problem}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scenarioInfo.constraints?.length ? (
                    <div>
                      <p className="font-semibold text-slate-800">制約</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {scenarioInfo.constraints.map((constraint) => (
                          <li key={constraint}>{constraint}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scenarioInfo.timeline ? (
                    <p>
                      <span className="font-semibold text-slate-800">タイムライン:</span> {scenarioInfo.timeline}
                    </p>
                  ) : null}
                  {scenarioInfo.successCriteria?.length ? (
                    <div>
                      <p className="font-semibold text-slate-800">成功条件</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {scenarioInfo.successCriteria.map((criterion) => (
                          <li key={criterion}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {activeScenario.supplementalInfo ? (
                    <div>
                      <p className="font-semibold text-slate-800">補足情報</p>
                      <p className="whitespace-pre-wrap">{activeScenario.supplementalInfo}</p>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
