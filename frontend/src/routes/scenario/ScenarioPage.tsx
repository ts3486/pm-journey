import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { defaultScenario, getScenarioById } from "@/config";
import type { Scenario } from "@/types";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import { TestCaseScenarioLayout } from "@/components/scenario/TestCaseScenarioLayout";
import { useProductConfig } from "@/queries/productConfig";
import ReactMarkdown from "react-markdown";
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

const truncateText = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
};

const takeUnique = (values: string[], limit: number) => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized) || result.length >= limit) return;
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
};

const extractPromptHighlights = (prompt?: string, limit = 3) => {
  if (!prompt) return [];
  const lines = prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, "").replace(/^>\s*/, ""))
    .filter((line) => line.length > 8)
    .map((line) => truncateText(line, 84));
  return takeUnique(lines, limit);
};

export function ScenarioPage() {
  const [state, setState] = useState<SessionState | null>(null);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const restart = searchParams.get("restart") === "1";
  const scenarioIdParam = searchParams.get("scenarioId");
  const { data: productConfig } = useProductConfig();
  const productPrompt = productConfig?.productPrompt?.trim();

  const activeScenario = useMemo<Scenario>(() => {
    if (scenarioIdParam) return getScenarioById(scenarioIdParam) ?? defaultScenario;
    if (state?.session?.scenarioId) return getScenarioById(state.session.scenarioId) ?? defaultScenario;
    return defaultScenario;
  }, [scenarioIdParam, state?.session?.scenarioId]);

  const hasActive = Boolean(state?.session);
  const missions = activeScenario.missions ?? [];
  const missionStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (state?.session.missionStatus ?? []).forEach((mission) => map.set(mission.missionId, true));
    return map;
  }, [state?.session?.missionStatus]);
  const isBasicScenario = activeScenario.scenarioType === "basic";
  const hasUserResponse = (state?.messages ?? []).some((message) => message.role === "user");
  const canCompleteScenario = hasActive && hasUserResponse;
  const scenarioLocked = isBasicScenario && hasUserResponse;
  const allMissionsComplete = missions.length > 0 && missions.every((mission) => missionStatusMap.get(mission.id));
  const scenarioInfo = activeScenario.product;
  const hasScenarioDetails =
    !!activeScenario.supplementalInfo ||
    !!scenarioInfo.summary ||
    !!scenarioInfo.audience ||
    (scenarioInfo.goals?.length ?? 0) > 0 ||
    (scenarioInfo.problems?.length ?? 0) > 0 ||
    (scenarioInfo.constraints?.length ?? 0) > 0 ||
    (scenarioInfo.successCriteria?.length ?? 0) > 0 ||
    !!scenarioInfo.timeline;
  const hasScenarioInfo = !!productPrompt || hasScenarioDetails;
  const promptHighlights = useMemo(() => extractPromptHighlights(productPrompt, 3), [productPrompt]);
  const quickFacts = useMemo(() => {
    const facts: Array<{ label: string; value: string }> = [];
    facts.push({ label: "プロダクト", value: scenarioInfo.name });
    if (scenarioInfo.audience) {
      facts.push({ label: "対象", value: truncateText(scenarioInfo.audience, 46) });
    }
    if (scenarioInfo.timeline) {
      facts.push({ label: "タイムライン", value: truncateText(scenarioInfo.timeline, 46) });
    }
    return facts.slice(0, 3);
  }, [scenarioInfo.audience, scenarioInfo.name, scenarioInfo.timeline]);
  const briefingSections = useMemo(() => {
    const contextEntries = takeUnique(
      [
        scenarioInfo.summary ? `背景: ${truncateText(scenarioInfo.summary, 96)}` : "",
        activeScenario.supplementalInfo ? `補足: ${truncateText(activeScenario.supplementalInfo, 96)}` : "",
      ],
      2,
    );
    const targetAndGoalEntries = takeUnique(
      [
        scenarioInfo.audience ? `対象ユーザー: ${truncateText(scenarioInfo.audience, 72)}` : "",
        ...(scenarioInfo.goals ?? []).slice(0, 2).map((goal) => `目標: ${truncateText(goal, 72)}`),
      ],
      3,
    );
    const riskEntries = takeUnique(
      [
        ...(scenarioInfo.problems ?? []).slice(0, 2).map((problem) => `課題: ${truncateText(problem, 72)}`),
        ...(scenarioInfo.constraints ?? []).slice(0, 2).map((constraint) => `制約: ${truncateText(constraint, 72)}`),
      ],
      4,
    );
    const successEntries = takeUnique(
      [
        scenarioInfo.timeline ? `進行目安: ${truncateText(scenarioInfo.timeline, 72)}` : "",
        ...(scenarioInfo.successCriteria ?? [])
          .slice(0, 2)
          .map((criterion) => `成功の目安: ${truncateText(criterion, 72)}`),
      ],
      3,
    );
    return [
      { id: "context", title: "コンテキスト", entries: contextEntries },
      { id: "goal", title: "対象とゴール", entries: targetAndGoalEntries },
      { id: "risk", title: "課題と制約", entries: riskEntries },
      { id: "success", title: "完了イメージ", entries: successEntries },
    ].filter((section) => section.entries.length > 0);
  }, [activeScenario.supplementalInfo, scenarioInfo]);

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
    if (!state?.session) return;
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
          <ChatStream messages={state?.messages ?? []} maxHeight="60vh" isTyping={awaitingReply} />
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
            {!canCompleteScenario ? (
              <p className="mt-2 text-xs text-slate-500">評価を開始するには、先に1件以上メッセージを送信してください。</p>
            ) : null}
          </div>

          {hasScenarioInfo ? (
            <div className="card space-y-3 p-4">
              <div className="rounded-xl border border-slate-200/70 bg-gradient-to-b from-slate-50 to-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">プロジェクトブリーフ</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    要点のみ表示
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="rounded-lg border border-slate-200/70 bg-white px-2.5 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{fact.label}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-800">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {promptHighlights.length > 0 ? (
                <div className="rounded-xl border border-indigo-100/80 bg-indigo-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                      プロジェクト共通メモ（要約）
                    </p>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                      {promptHighlights.length} point
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {promptHighlights.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-xs text-indigo-950/90">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        <span className="leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-indigo-700">
                      元のメモを表示
                    </summary>
                    <ReactMarkdown className="markdown-preview mt-2 text-xs text-slate-700">
                      {productPrompt ?? ""}
                    </ReactMarkdown>
                  </details>
                </div>
              ) : null}

              {hasScenarioDetails ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    背景・補足情報（カテゴリ要約）
                  </p>
                  {briefingSections.map((section) => (
                    <div key={section.id} className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                      <p className="text-xs font-semibold text-slate-800">{section.title}</p>
                      <ul className="mt-1.5 space-y-1">
                        {section.entries.map((entry) => (
                          <li key={entry} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                            <span className="leading-relaxed">{entry}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
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
