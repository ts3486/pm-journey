import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

import { getScenarioById } from "@/config";
import { canViewTeamManagement } from "@/lib/teamAccess";
import { useCurrentOrganization } from "@/queries/organizations";
import { api } from "@/services/api";
import { getHistoryItem } from "@/services/history";
import { addOutput, deleteOutput, listOutputs } from "@/services/outputs";
import { evaluateSessionById } from "@/services/sessions";
import { logEvent } from "@/services/telemetry";
import type {
  HistoryItem,
  Message,
  OutputSubmission,
  OutputSubmissionType,
  TestCase,
} from "@/types";

const categoryPalettes = [
  {
    gradient: "from-teal-400 to-emerald-500",
    bg: "bg-gradient-to-br from-teal-50 to-emerald-50",
    border: "border-teal-200/60",
    accent: "text-teal-600",
    badge: "bg-teal-100 text-teal-700 border-teal-200/50",
    glow: "shadow-teal-200/50",
    dot: "bg-teal-500",
    bar: "bg-gradient-to-r from-teal-400 to-emerald-400",
  },
  {
    gradient: "from-rose-400 to-pink-500",
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    border: "border-rose-200/60",
    accent: "text-rose-600",
    badge: "bg-rose-100 text-rose-700 border-rose-200/50",
    glow: "shadow-rose-200/50",
    dot: "bg-rose-500",
    bar: "bg-gradient-to-r from-rose-400 to-pink-400",
  },
  {
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-gradient-to-br from-violet-50 to-purple-50",
    border: "border-violet-200/60",
    accent: "text-violet-600",
    badge: "bg-violet-100 text-violet-700 border-violet-200/50",
    glow: "shadow-violet-200/50",
    dot: "bg-violet-500",
    bar: "bg-gradient-to-r from-violet-400 to-purple-400",
  },
  {
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-200/60",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200/50",
    glow: "shadow-amber-200/50",
    dot: "bg-amber-500",
    bar: "bg-gradient-to-r from-amber-400 to-orange-400",
  },
] as const;

function ScoreRing({ score, size = 120 }: { score: number | null | undefined; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const numericScore = score ?? 0;
  const clampedScore = Math.max(0, Math.min(100, numericScore));
  const offset = circumference - (clampedScore / 100) * circumference;

  const getScoreColor = (value: number) => {
    if (value >= 80) return { stroke: "url(#scoreGradientHigh)", text: "text-emerald-600" };
    if (value >= 60) return { stroke: "url(#scoreGradientMid)", text: "text-amber-600" };
    return { stroke: "url(#scoreGradientLow)", text: "text-rose-600" };
  };

  const colors = getScoreColor(numericScore);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <defs>
          <linearGradient id="scoreGradientHigh" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="scoreGradientMid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="scoreGradientLow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-slate-200/50"
        />
        {score != null ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score != null ? (
          <>
            <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>{Math.round(score)}</span>
            <span className="text-xs font-medium text-slate-500">/ 100</span>
          </>
        ) : (
          <span className="text-sm text-slate-400">--</span>
        )}
      </div>
    </div>
  );
}

function CategoryCard({
  name,
  score,
  weight,
  palette,
  delay,
}: {
  name: string;
  score: number | null | undefined;
  weight: number;
  palette: (typeof categoryPalettes)[number];
  delay: number;
}) {
  const percentage = Math.max(0, Math.min(100, score ?? 0));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${palette.border} ${palette.bg} p-4 shadow-lg ${palette.glow} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl reveal`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      <div
        className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${palette.gradient} opacity-20 blur-xl`}
      />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${palette.accent}`}>Category</p>
            <p className="text-sm font-semibold leading-tight text-slate-800">{name}</p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${palette.gradient} shadow-md`}
          >
            <span className="text-sm font-bold text-white tabular-nums">{score != null ? Math.round(score) : "--"}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
            <div
              className={`h-full rounded-full ${palette.bar} transition-all duration-700 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${palette.badge}`}
            >
              重み {weight}%
            </span>
            <span className="text-[10px] font-medium text-slate-500">{score != null ? "確定" : "未確定"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryDetailPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: currentOrganization } = useCurrentOrganization();

  const autoEvaluate = searchParams.get("autoEvaluate") === "1";
  const autoTriggeredRef = useRef(false);

  const [manualEvaluationRequest, setManualEvaluationRequest] = useState<{
    sessionId?: string;
    requested: boolean;
  }>({ sessionId, requested: false });
  const [showScenarioInfo, setShowScenarioInfo] = useState(false);

  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const currentUserRole = currentOrganization?.membership.role ?? null;
  const canPostManagerComment = canViewTeamManagement(currentUserRole);
  const currentOrganizationName = currentOrganization?.organization.name ?? null;
  const currentOrganizationId = currentOrganization?.organization.id ?? null;
  const showMemberTeamInfo = currentUserRole === "member" && currentOrganizationName;

  const [outputKind, setOutputKind] = useState<OutputSubmissionType>("text");
  const [outputValue, setOutputValue] = useState("");
  const [outputNote, setOutputNote] = useState("");

  const {
    data: item,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["history", sessionId],
    queryFn: () => getHistoryItem(sessionId ?? ""),
    enabled: Boolean(sessionId),
  });

  const scenario = item?.scenarioId ? getScenarioById(item.scenarioId) : undefined;
  const isTestCaseScenario = scenario?.scenarioType === "test-case";
  const isBasicScenario = scenario?.scenarioType === "basic";
  const missionList =
    scenario?.missions && scenario.missions.length > 0
      ? [...scenario.missions].sort((a, b) => a.order - b.order)
      : undefined;

  const { data: outputs = [] } = useQuery({
    queryKey: ["outputs", sessionId ?? "unknown"],
    queryFn: () => listOutputs(sessionId ?? ""),
    enabled: Boolean(sessionId && item),
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ["testCases", sessionId ?? "unknown"],
    queryFn: () => api.listTestCases(sessionId ?? ""),
    enabled: Boolean(sessionId && item) && isTestCaseScenario,
  });

  const addOutputMutation = useMutation({
    mutationFn: async (payload: { kind: OutputSubmissionType; value: string; note?: string }) => {
      if (!sessionId) throw new Error("sessionId is required");
      return addOutput(sessionId, payload.kind, payload.value, payload.note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outputs", sessionId ?? "unknown"] });
      setOutputValue("");
      setOutputNote("");
    },
  });

  const deleteOutputMutation = useMutation({
    mutationFn: async (outputId: string) => {
      if (!sessionId) throw new Error("sessionId is required");
      return deleteOutput(sessionId, outputId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outputs", sessionId ?? "unknown"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (payload: { content: string; authorName?: string }) => {
      if (!sessionId) throw new Error("sessionId is required");
      return api.createComment(sessionId, payload);
    },
    onSuccess: () => {
      setCommentText("");
      setCommentError(null);
      queryClient.invalidateQueries({ queryKey: ["history", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["history", "list"] });
    },
    onError: (err: unknown) => {
      setCommentError(err instanceof Error ? err.message : "コメントの投稿に失敗しました。");
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (payload: { scenarioId?: string; testCasesContext?: string }) => {
      if (!sessionId) throw new Error("sessionId is required");
      return evaluateSessionById(sessionId, payload.scenarioId, payload.testCasesContext);
    },
    onSuccess: (evaluation) => {
      if (!sessionId) return;
      queryClient.setQueryData<HistoryItem | null>(["history", sessionId], (prev) =>
        prev ? { ...prev, evaluation } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ["history", "list"] });
    },
  });

  const hasMessages = (item?.actions?.length ?? 0) > 0;
  const hasTestCases = isTestCaseScenario && testCases.length > 0;
  const canEvaluate = hasMessages || hasTestCases;
  const evaluating = evaluateMutation.isPending;

  const manualEvaluationRequested =
    manualEvaluationRequest.sessionId === sessionId ? manualEvaluationRequest.requested : false;
  const autoEvaluationRequested = autoEvaluate && !!item && !item.evaluation;
  const evaluationAttempted = manualEvaluationRequested || autoEvaluationRequested;
  const missingActionsError = evaluationAttempted && !canEvaluate;
  const evaluationError = evaluationAttempted
    ? missingActionsError
      ? isTestCaseScenario
        ? "評価対象のテストケースがありません。"
        : "評価対象のメッセージがありません。"
      : evaluateMutation.error?.message ?? null
    : null;

  const formatTestCasesContext = useCallback(() => {
    if (!isTestCaseScenario || testCases.length === 0) return undefined;
    return testCases
      .map((testCase: TestCase, index) => {
        const lines = [
          `### テストケース ${index + 1}: ${testCase.name}`,
          `- 前提条件: ${testCase.preconditions || "なし"}`,
          `- 手順: ${testCase.steps}`,
          `- 期待結果: ${testCase.expectedResult}`,
        ];
        return lines.join("\n");
      })
      .join("\n\n");
  }, [isTestCaseScenario, testCases]);

  const runEvaluation = useCallback((): boolean => {
    if (!sessionId || !item || evaluating) return false;
    const testCasesContext = formatTestCasesContext();
    const hasActions = item.actions && item.actions.length > 0;
    const hasTestCasesForEval = !!testCasesContext;

    if (!hasActions && !hasTestCasesForEval) return false;

    evaluateMutation.mutate(
      { scenarioId: item.scenarioId, testCasesContext },
      {
        onSuccess: (evaluation) => {
          logEvent({
            type: "evaluation",
            sessionId,
            scenarioId: item.scenarioId,
            scenarioDiscipline: item.scenarioDiscipline,
            score: evaluation?.overallScore,
          });
        },
      },
    );

    return true;
  }, [evaluateMutation, evaluating, formatTestCasesContext, item, sessionId]);

  const handleRunEvaluation = useCallback(() => {
    if (!sessionId) return;
    setManualEvaluationRequest({ sessionId, requested: true });
    runEvaluation();
  }, [runEvaluation, sessionId]);

  useEffect(() => {
    autoTriggeredRef.current = false;
  }, [sessionId, autoEvaluate]);

  useEffect(() => {
    if (!autoEvaluate) return;
    if (!item || item.evaluation) return;
    if (autoTriggeredRef.current) return;

    const triggered = runEvaluation();
    if (triggered) autoTriggeredRef.current = true;
  }, [autoEvaluate, item, runEvaluation]);

  const handleAddOutput = async () => {
    const trimmed = outputValue.trim();
    if (!trimmed) return;
    await addOutputMutation.mutateAsync({
      kind: outputKind,
      value: trimmed,
      note: outputNote.trim() || undefined,
    });
  };

  const handleDeleteOutput = async (outputId: string) => {
    await deleteOutputMutation.mutateAsync(outputId);
  };

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPostManagerComment) {
      setCommentError("上長コメントの投稿権限がありません。owner / admin / manager のみ投稿できます。");
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) return;
    await addCommentMutation.mutateAsync({
      content: trimmed,
      authorName: commentAuthor.trim() || "上長",
    });
  };

  const evaluation = item?.evaluation;
  const categories = evaluation?.categories ?? [];
  const primaryCategories = categories.slice(0, 4);
  const missionFeedbackEntries = useMemo(() => {
    if (!isBasicScenario) return [];
    const source = missionList && missionList.length > 0 ? missionList : categories;

    return source.map((mission, idx) => {
      const matchedCategory =
        "title" in mission
          ? categories.find((category) => category.name === mission.title) ?? categories[idx]
          : mission;

      return {
        title: "title" in mission ? mission.title : mission.name ?? `コメント ${idx + 1}`,
        key: "id" in mission ? mission.id : `${mission.name ?? "category"}-${idx}`,
        score: typeof matchedCategory?.score === "number" ? matchedCategory.score : null,
        weight: typeof matchedCategory?.weight === "number" ? matchedCategory.weight : 0,
        feedback: matchedCategory?.feedback ?? "評価コメントがまだありません。",
      };
    });
  }, [categories, isBasicScenario, missionList]);
  const basicMissionScore = useMemo(() => {
    if (!isBasicScenario || missionFeedbackEntries.length === 0) return null;

    const scoredEntries = missionFeedbackEntries.filter((entry) => entry.score != null);
    if (scoredEntries.length === 0) return null;

    const totalWeight = scoredEntries.reduce(
      (sum, entry) => sum + (entry.weight > 0 ? entry.weight : 0),
      0,
    );
    if (totalWeight > 0) {
      return scoredEntries.reduce(
        (sum, entry) => sum + (entry.score ?? 0) * (entry.weight > 0 ? entry.weight : 0),
        0,
      ) / totalWeight;
    }

    return scoredEntries.reduce((sum, entry) => sum + (entry.score ?? 0), 0) / scoredEntries.length;
  }, [isBasicScenario, missionFeedbackEntries]);
  const persistedMessages = item?.actions ?? [];
  const kickoffPrompt = scenario?.kickoffPrompt?.trim();
  const hasKickoffPromptInLog = kickoffPrompt
    ? persistedMessages.some((message) => message.role === "system" && message.content.trim() === kickoffPrompt)
    : false;
  const kickoffMessage: Message | null =
    kickoffPrompt && !hasKickoffPromptInLog
      ? {
          id: `kickoff-${item?.sessionId ?? "unknown"}`,
          sessionId: item?.sessionId ?? "unknown",
          role: "system",
          content: kickoffPrompt,
          createdAt: persistedMessages[0]?.createdAt ?? new Date().toISOString(),
          tags: ["summary"],
        }
      : null;
  const chatLogMessages = kickoffMessage ? [kickoffMessage, ...persistedMessages] : persistedMessages;

  if (!sessionId) {
    return <p className="text-sm text-slate-600">セッションIDが指定されていません。</p>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
      </div>
    );
  }

  if (evaluating && (!item || !item.evaluation)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
          <p className="text-sm">評価を実行しています…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8efe4]"
        >
          <span aria-hidden="true">←</span> ロードマップに戻る
        </Link>
        <div className="rounded-2xl border border-red-200/60 bg-red-50/80 p-6 text-sm text-red-700">
          <p className="font-semibold">読み込みエラー</p>
          <p className="mt-1 text-slate-700">{error instanceof Error ? error.message : "エラーが発生しました"}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8efe4]"
        >
          <span aria-hidden="true">←</span> ロードマップに戻る
        </Link>
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">セッションが見つかりません</h2>
          <p className="mt-2 text-sm text-slate-500">
            ID: <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">{sessionId}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8efe4]"
        >
          <span aria-hidden="true">←</span> ロードマップに戻る
        </Link>
        {item.scenarioId ? (
          <Link
            to={`/scenario?scenarioId=${item.scenarioId}&restart=1`}
            className="btn-secondary !px-3 !py-1.5 !text-xs"
          >
            再挑戦
          </Link>
        ) : null}
      </div>

            <div className="card overflow-hidden">
              <div className="border-b border-orange-100/50 bg-gradient-to-r from-orange-50/80 to-amber-50/50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">{item.scenarioDiscipline ?? "Scenario"}</p>
                    <h1 className="mt-1 text-lg font-bold text-slate-900">{scenario && scenario.title}</h1>
                    {showMemberTeamInfo ? (
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        所属チーム: <span className="font-semibold text-slate-900">{currentOrganizationName}</span>
                      </p>
                    ) : null}
                    {missionList && missionList.length > 0 ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-slate-600 underline-offset-2 hover:underline">
                          ミッションを表示
                        </summary>
                        <ol className="mt-2 space-y-1.5 text-xs text-slate-700">
                          {missionList.map((mission) => (
                            <li key={mission.id} className="flex items-start gap-2">
                              <span className="mt-0.5 text-[10px] font-semibold text-slate-500">{mission.order}.</span>
                              <span className="leading-relaxed">{mission.title}</span>
                            </li>
                          ))}
                        </ol>
                      </details>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

      

      {evaluationError ? (
        <div className="card border border-rose-200/60 bg-rose-50/60 p-4 text-sm text-rose-700">
          <p className="font-semibold text-rose-800">評価に失敗しました。</p>
          <p className="mt-1 text-xs text-rose-600">{evaluationError}</p>
          {canEvaluate ? (
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              onClick={handleRunEvaluation}
              disabled={evaluating}
            >
              再試行する
            </button>
          ) : null}
        </div>
      ) : null}

      {!evaluation ? (
        <div className="card border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">このセッションはまだ評価されていません。</p>
          <p className="mt-1 text-xs text-slate-500">評価を実行すると、スコアとフィードバックが表示されます。</p>
          {!canEvaluate ? (
            <p className="mt-2 text-xs text-slate-500">会話メッセージがないため評価できません。</p>
          ) : null}
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
            onClick={handleRunEvaluation}
            disabled={evaluating || !canEvaluate}
          >
            評価を実行する
          </button>
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 blur-2xl" />
          </div>

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Overall Evaluation</p>
              <h2 className="mt-2 text-2xl font-bold text-white">総合評価</h2>
              {evaluation?.passing != null ? (
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      evaluation.passing
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                    }`}
                  >
                    {evaluation.passing ? "合格想定" : "改善が必要"}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <ScoreRing
                score={isBasicScenario ? (basicMissionScore ?? evaluation?.overallScore) : evaluation?.overallScore}
                size={130}
              />
              {isBasicScenario ? (
                <p className="text-xs text-slate-200">ミッション評価をもとに算出</p>
              ) : null}
            </div>
          </div>
        </div>

        {evaluation ? (
          <div className="p-5">
            {isBasicScenario ? (
              <>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Mission Feedback</p>
                <div className="space-y-3">
                  {missionFeedbackEntries.map((entry) => {
                    return (
                      <div key={entry.key} className="rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 tabular-nums">
                            {entry.score != null ? `${Math.round(entry.score)}点` : "未採点"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">{entry.feedback}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Category Breakdown</p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {primaryCategories.map((category, idx) => (
                    <CategoryCard
                      key={category.name}
                      name={category.name}
                      score={category.score}
                      weight={category.weight}
                      palette={categoryPalettes[idx % categoryPalettes.length]}
                      delay={100 + idx * 100}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {evaluation.summary ? (
                <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">サマリ</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{evaluation.summary}</p>
                </div>
              ) : null}
              {evaluation.improvementAdvice ? (
                <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-amber-50/50 to-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">改善提案</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">{evaluation.improvementAdvice}</p>
                </div>
              ) : null}
            </div>

            {!isBasicScenario && categories.length > 0 ? (
              <div className="mt-6 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white p-4">
                <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-600">カテゴリ別フィードバック</p>
                <div className="space-y-3">
                  {categories.map((category, idx) => {
                    const palette = categoryPalettes[idx % categoryPalettes.length];
                    return (
                      <div
                        key={`${category.name}-feedback`}
                        className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white/80 p-3"
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${palette.gradient}`}
                        >
                          <span className="text-xs font-bold text-white tabular-nums">{category.score ?? "-"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{category.name}</span>
                            <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
                          </div>
                          {category.feedback ? (
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">{category.feedback}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-orange-200 to-amber-200" />
            <p className="mt-4 text-sm text-slate-600">評価結果を待っています...</p>
          </div>
        )}
      </div>

      {isTestCaseScenario ? (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">テストケース</h2>
              <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                {testCases.length} 件
              </span>
            </div>
            {testCases.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  const headers = ["No", "テスト名", "前提条件", "手順", "期待結果"];
                  const rows = testCases.map((testCase, idx) => [
                    idx + 1,
                    testCase.name,
                    testCase.preconditions,
                    testCase.steps,
                    testCase.expectedResult,
                  ]);

                  const escapeCSV = (value: string | number) => {
                    const str = String(value);
                    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                      return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                  };

                  const csvContent = [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
                  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = `test-cases-${sessionId}.csv`;
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100"
              >
                CSVダウンロード
              </button>
            ) : null}
          </div>

          {testCases.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">テストケースはまだ作成されていません。</p>
          ) : (
            <div className="space-y-3">
              {testCases.map((testCase, idx) => (
                <div
                  key={testCase.id}
                  className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50/80 to-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-sm font-semibold text-slate-900">{testCase.name}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">前提条件</span>
                          <p className="text-xs leading-relaxed text-slate-600">{testCase.preconditions}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">手順</span>
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{testCase.steps}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">期待結果</span>
                          <p className="text-xs leading-relaxed text-slate-600">{testCase.expectedResult}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">チャットログ</h2>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto rounded-xl bg-slate-50/80 p-3">
          {chatLogMessages.length ? (
            chatLogMessages.map((message: Message, idx: number) => (
              <div
                key={message.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-8 border-orange-100/50 bg-linear-to-br from-orange-50 to-amber-50"
                    : "mr-8 border-slate-100 bg-white"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    message.role === "user" ? "text-orange-600" : "text-slate-500"
                  }`}
                >
                  {message.role}
                </p>
                <div className="mt-1 whitespace-pre-wrap text-slate-800">
                  <ReactMarkdown className="markdown-preview">{message.content}</ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-slate-500">チャットログはありません。</p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between rounded-lg">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">成果物の提出</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {outputs.length} 件
              </span>
            </div>
            <span className="text-xs text-slate-500 transition group-open:rotate-180">▼</span>
          </summary>

          <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold text-slate-600" htmlFor="output-kind">種類</label>
                <select
                  id="output-kind"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  value={outputKind}
                  onChange={(event) => setOutputKind(event.target.value as OutputSubmissionType)}
                >
                  <option value="text">テキスト</option>
                  <option value="url">URL</option>
                  <option value="image">画像URL</option>
                </select>
              </div>

              {outputKind === "text" ? (
                <textarea
                  className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  placeholder="作成した内容や結論を記載してください"
                  value={outputValue}
                  onChange={(event) => setOutputValue(event.target.value)}
                />
              ) : (
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  placeholder={outputKind === "url" ? "https://example.com" : "https://.../image.png"}
                  value={outputValue}
                  onChange={(event) => setOutputValue(event.target.value)}
                />
              )}

              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                placeholder="補足メモ（任意）"
                value={outputNote}
                onChange={(event) => setOutputNote(event.target.value)}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddOutput}
                  disabled={!outputValue.trim() || addOutputMutation.isPending}
                >
                  追加する
                </button>
              </div>
            </div>
          </div>

          {outputs.length === 0 ? (
            <p className="mt-4 text-center text-xs text-slate-500">まだ成果物は提出されていません。</p>
          ) : (
            <div className="mt-4 space-y-3">
              {outputs.map((output: OutputSubmission) => (
                <div key={output.id} className="rounded-xl border border-slate-200/70 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 text-sm text-slate-800">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {output.kind === "text" ? "Text" : output.kind === "url" ? "URL" : "Image"}
                        </span>
                        <span>{new Date(output.createdAt).toLocaleString()}</span>
                      </div>

                      {output.kind === "image" ? (
                        <div className="space-y-2">
                          <img
                            src={output.value}
                            alt="提出画像"
                            className="max-h-48 rounded-lg border border-slate-200 object-contain"
                          />
                          <p className="break-all text-xs text-slate-500">{output.value}</p>
                        </div>
                      ) : output.kind === "url" ? (
                        <a
                          href={output.value}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sm text-emerald-700 underline"
                        >
                          {output.value}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap">{output.value}</p>
                      )}

                      {output.note ? <p className="text-xs text-slate-500">メモ: {output.note}</p> : null}
                    </div>

                    <button
                      type="button"
                      className="text-xs text-slate-400 transition hover:text-slate-600"
                      onClick={() => handleDeleteOutput(output.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </details>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">上長コメント</h2>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            {(item.comments ?? []).length} 件
          </span>
        </div>

        {(item.comments ?? []).length > 0 ? (
          <div className="mb-4 space-y-2">
            {(item.comments ?? []).map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-violet-100/50 bg-gradient-to-br from-violet-50/50 to-white px-4 py-3"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-violet-700">{comment.authorName ?? "上長"}</span>
                  <span className="text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 py-4 text-center text-xs text-slate-500">まだコメントはありません。</p>
        )}

        {canPostManagerComment ? (
          <form onSubmit={handleAddComment} className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-600">新しいコメントを追加</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="お名前（任意）… 例: 上長"
                value={commentAuthor}
                aria-label="お名前"
                name="commentAuthor"
                autoComplete="name"
                onChange={(event) => setCommentAuthor(event.target.value)}
                className="input-base text-sm"
                disabled={addCommentMutation.isPending}
              />
              <textarea
                placeholder="コメントを入力… 例: 次回はここを改善してみましょう"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                aria-label="コメント"
                name="comment"
                autoComplete="off"
                className="input-base text-sm"
                rows={3}
                disabled={addCommentMutation.isPending}
              />
              {commentError ? <p className="text-sm text-red-600">{commentError}</p> : null}
              <button
                type="submit"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addCommentMutation.isPending ? "送信中..." : "コメントを追加"}
              </button>
            </div>
          </form>
        ) : (
          <p className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
            上長コメントは閲覧のみ可能です。投稿は owner / admin / manager のみ実行できます。
          </p>
        )}
      </div>
    </div>
  );
}
