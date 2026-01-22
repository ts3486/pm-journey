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
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

export default function ScenarioPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm text-slate-700">読み込み中...</div>
      }
    >
      <ScenarioContent />
    </Suspense>
  );
}

function ScenarioContent() {
  const [state, setState] = useState<SessionState | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const autoEvalAttempted = useRef<Record<string, boolean>>({});
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
      const confirmed = window.confirm("このシナリオのセッションを終了して新しく始めますか？");
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

  const handleMissionToggle = (missionId: string, completed: boolean) => {
    if (!state) return;
    const next = updateMissionStatus(state, missionId, completed);
    setState(next);
    const nextAllComplete =
      missions.length > 0 && missions.every((m) => (next.session.missionStatus ?? []).some((s) => s.missionId === m.id));
    if (nextAllComplete && !next.offline) {
      void runEvalAndRedirect(next);
    }
  };

  const handleSend = async (content: string) => {
    if (!state) return;
    const next = await sendMessage(state, "user", content);
    setState(next);
  };

  const handleEvaluate = async () => {
    if (!state) return;
    await runEvalAndRedirect(state, false);
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

  useEffect(() => {
    const sessionId = state?.session?.id;
    if (
      !state ||
      !sessionId ||
      state.evaluation ||
      !allMissionsComplete ||
      state.offline ||
      !evaluationReady
    ) {
      return;
    }
    if (autoEvalAttempted.current[sessionId]) return;
    autoEvalAttempted.current[sessionId] = true;
    void runEvalAndRedirect(state);
  }, [state, allMissionsComplete, evaluationReady]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sky-700">{activeScenario.discipline} シナリオ</p>
            <h1 className="text-xl font-semibold text-slate-900">{activeScenario.title}</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? "開く" : "閉じる"}
          </button>
        </div>
        {!isCollapsed && (
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <p>{activeScenario.description}</p>
            <div className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2">
              <button
                type="button"
                onClick={() => setIsGoalOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left text-sky-800"
              >
                <span className="text-xs font-semibold">目標・背景</span>
                <span className="text-xs">{isGoalOpen ? "閉じる" : "開く"}</span>
              </button>
              {isGoalOpen && (
                <div className="mt-2 space-y-1 text-slate-800">
                  {activeScenario.product.summary ? (
                    <p className="text-xs">概要: {activeScenario.product.summary}</p>
                  ) : null}
                  {activeScenario.product.goals?.length ? (
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900">ゴール</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {activeScenario.product.goals.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {activeScenario.product.problems?.length ? (
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900">課題</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {activeScenario.product.problems.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {activeScenario.supplementalInfo ? (
              <div className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-slate-800">
                <p className="text-xs font-semibold text-sky-800">補足情報</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{activeScenario.supplementalInfo}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {state?.offline ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          オフラインです。メッセージはキューに保存され、評価はオンライン復帰後に実行できます。
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-sky-100 bg-white p-4 shadow-sm lg:col-span-2">
          <ChatStream messages={state?.messages ?? []} maxHeight="65vh" />
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

        <div className="space-y-4 rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">ミッション</p>
              {allMissionsComplete ? (
                <span className="text-xs font-semibold text-emerald-600">完了</span>
              ) : (
                <span className="text-xs text-slate-500">進行中</span>
              )}
            </div>
            <ul className="mt-2 space-y-2">
              {missions.length === 0 ? (
                <li className="text-xs text-slate-500">設定されたミッションはありません。</li>
              ) : (
                missions
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((mission) => {
                    const done = missionStatusMap.get(mission.id) ?? false;
                    return (
                      <li key={mission.id} className="flex items-start gap-2 rounded-md border border-sky-100 px-3 py-2">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
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
          {activeScenario.supplementalInfo ? (
            <div className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-slate-800">
              <p className="text-xs font-semibold text-sky-800">補足情報</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{activeScenario.supplementalInfo}</p>
            </div>
          ) : null}
          {allMissionsComplete && !state?.offline ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              全ミッション完了。評価を実行しています…{loadingEval ? "（処理中）" : ""}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
