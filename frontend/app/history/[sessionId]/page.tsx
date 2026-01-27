"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAddComment } from "@/queries/comments";
import { useEvaluateSession } from "@/queries/evaluation";
import { useHistoryItem } from "@/queries/history";
import { useAddOutput, useDeleteOutput, useOutputs } from "@/queries/outputs";
import { getScenarioById } from "@/config/scenarios";
import { logEvent } from "@/services/telemetry";
import type { OutputSubmissionType } from "@/types/session";

// Vibrant color palette for category cards
const categoryPalettes = [
  {
    name: "teal",
    gradient: "from-teal-400 to-emerald-500",
    bg: "bg-gradient-to-br from-teal-50 to-emerald-50",
    border: "border-teal-200/60",
    text: "text-teal-700",
    accent: "text-teal-600",
    badge: "bg-teal-100 text-teal-700 border-teal-200/50",
    glow: "shadow-teal-200/50",
    ring: "ring-teal-400/30",
    dot: "bg-teal-500",
    bar: "bg-gradient-to-r from-teal-400 to-emerald-400",
  },
  {
    name: "rose",
    gradient: "from-rose-400 to-pink-500",
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    border: "border-rose-200/60",
    text: "text-rose-700",
    accent: "text-rose-600",
    badge: "bg-rose-100 text-rose-700 border-rose-200/50",
    glow: "shadow-rose-200/50",
    ring: "ring-rose-400/30",
    dot: "bg-rose-500",
    bar: "bg-gradient-to-r from-rose-400 to-pink-400",
  },
  {
    name: "violet",
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-gradient-to-br from-violet-50 to-purple-50",
    border: "border-violet-200/60",
    text: "text-violet-700",
    accent: "text-violet-600",
    badge: "bg-violet-100 text-violet-700 border-violet-200/50",
    glow: "shadow-violet-200/50",
    ring: "ring-violet-400/30",
    dot: "bg-violet-500",
    bar: "bg-gradient-to-r from-violet-400 to-purple-400",
  },
  {
    name: "amber",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-200/60",
    text: "text-amber-700",
    accent: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200/50",
    glow: "shadow-amber-200/50",
    ring: "ring-amber-400/30",
    dot: "bg-amber-500",
    bar: "bg-gradient-to-r from-amber-400 to-orange-400",
  },
];

function ScoreRing({ score, size = 120 }: { score: number | null | undefined; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const displayScore = score ?? 0;
  const offset = circumference - (displayScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: "url(#scoreGradientHigh)", text: "text-emerald-600" };
    if (s >= 60) return { stroke: "url(#scoreGradientMid)", text: "text-amber-600" };
    return { stroke: "url(#scoreGradientLow)", text: "text-rose-600" };
  };

  const colors = getScoreColor(displayScore);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
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
        {score != null && (
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
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score != null ? (
          <>
            <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>{score}</span>
            <span className="text-xs text-slate-500 font-medium">/ 100</span>
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
  palette: (typeof categoryPalettes)[0];
  delay: number;
}) {
  const percentage = score ?? 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${palette.border} ${palette.bg} p-4 shadow-lg ${palette.glow} transition-all duration-300 hover:shadow-xl hover:scale-[1.02] reveal`}
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
    >
      {/* Decorative corner accent */}
      <div
        className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${palette.gradient} opacity-20 blur-xl`}
      />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${palette.accent}`}>
              Category
            </p>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${palette.gradient} shadow-md`}
          >
            <span className="text-sm font-bold text-white tabular-nums">
              {score != null ? score : "--"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
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
            <span className="text-[10px] text-slate-500 font-medium">
              {score != null ? "確定" : "未確定"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryDetailPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const searchParams = useSearchParams();
  const autoEvaluate = searchParams?.get("autoEvaluate") === "1";
  const { data: item, isLoading } = useHistoryItem(sessionId);
  const { data: outputs = [] } = useOutputs(sessionId);
  const addOutputMutation = useAddOutput(sessionId);
  const deleteOutputMutation = useDeleteOutput(sessionId);
  const addCommentMutation = useAddComment(sessionId);
  const evaluateMutation = useEvaluateSession(sessionId);
  const [manualEvaluationRequest, setManualEvaluationRequest] = useState<{
    sessionId?: string;
    requested: boolean;
  }>({ sessionId, requested: false });
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const [outputKind, setOutputKind] = useState<OutputSubmissionType>("text");
  const [outputValue, setOutputValue] = useState("");
  const [outputNote, setOutputNote] = useState("");
  const autoTriggeredRef = useRef(false);
  const scenario = item?.scenarioId ? getScenarioById(item.scenarioId) : undefined;
  const [showScenarioInfo, setShowScenarioInfo] = useState(false);
  const canEvaluate = (item?.actions?.length ?? 0) > 0;
  const evaluating = evaluateMutation.isPending;
  const manualEvaluationRequested =
    manualEvaluationRequest.sessionId === sessionId
      ? manualEvaluationRequest.requested
      : false;
  const autoEvaluationRequested = autoEvaluate && !!item && !item.evaluation;
  const evaluationAttempted = manualEvaluationRequested || autoEvaluationRequested;
  const missingActionsError = evaluationAttempted && !canEvaluate;
  const evaluationError = evaluationAttempted
    ? missingActionsError
      ? "評価対象のメッセージがありません。"
      : evaluateMutation.error?.message ?? null
    : null;

  useEffect(() => {
    autoTriggeredRef.current = false;
  }, [sessionId, autoEvaluate]);

  const runEvaluation = useCallback(
    () => {
      if (!sessionId || !item || evaluating) return;
      if (!item.actions || item.actions.length === 0) {
        return;
      }
      evaluateMutation.mutate(
        { scenarioId: item.scenarioId },
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
    },
    [sessionId, item, evaluating, evaluateMutation],
  );

  const handleRunEvaluation = useCallback(() => {
    if (!sessionId) return;
    setManualEvaluationRequest({ sessionId, requested: true });
    runEvaluation();
  }, [sessionId, runEvaluation]);

  const handleAddOutput = async () => {
    if (!sessionId) return;
    const trimmed = outputValue.trim();
    if (!trimmed) return;
    try {
      await addOutputMutation.mutateAsync({
        kind: outputKind,
        value: trimmed,
        note: outputNote.trim() || undefined,
      });
      setOutputValue("");
      setOutputNote("");
    } catch (error) {
      console.error("Failed to add output:", error);
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    if (!sessionId) return;
    deleteOutputMutation.mutate(outputId);
  };

  useEffect(() => {
    if (!autoEvaluate) return;
    if (!item || item.evaluation) return;
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;
    runEvaluation();
  }, [autoEvaluate, item, runEvaluation]);

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

  if (!item) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">セッションが見つかりません</h2>
        <p className="mt-2 text-sm text-slate-500">
          ID: <code className="rounded bg-slate-100 px-2 py-0.5 text-xs">{sessionId}</code>
        </p>
        <Link
          href="/history"
          className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          履歴一覧に戻る
        </Link>
      </div>
    );
  }

  const evaluation = item.evaluation;
  const categories = evaluation?.categories ?? [];
  const primaryCategories = categories.slice(0, 4);

  const handleAddComment = async () => {
    if (!sessionId || !commentText.trim()) return;
    try {
      await addCommentMutation.mutateAsync({
        content: commentText.trim(),
        authorName: commentAuthor.trim() || "上長",
      });
      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <div className="space-y-6">
      {evaluationError ? (
        <div className="card border border-rose-200/60 bg-rose-50/60 p-4 text-sm text-rose-700">
          <p className="font-semibold text-rose-800">評価に失敗しました。</p>
          <p className="mt-1 text-xs text-rose-600">{evaluationError}</p>
          {item && canEvaluate ? (
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
      {!evaluation && item ? (
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
      {/* Evaluation Hero Section */}
      <div className="card overflow-hidden">
        {/* Gradient header with overall score */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 blur-2xl" />
          </div>

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Overall Evaluation
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">総合評価</h2>
              {evaluation?.passing != null && (
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      evaluation.passing
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                    }`}
                  >
                    {evaluation.passing ? (
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {evaluation.passing ? "合格想定" : "改善が必要"}
                  </span>
                </div>
              )}
            </div>
            <ScoreRing score={evaluation?.overallScore} size={130} />
          </div>
        </div>

        {/* Category scores grid */}
        {evaluation && (
          <div className="p-5">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Category Breakdown
            </p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {primaryCategories.map((c, idx) => (
                <CategoryCard
                  key={c.name}
                  name={c.name}
                  score={c.score}
                  weight={c.weight}
                  palette={categoryPalettes[idx % categoryPalettes.length]}
                  delay={100 + idx * 100}
                />
              ))}
            </div>

            {/* Summary and improvement sections */}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {evaluation.summary && (
                <div className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-4 transition hover:shadow-md">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-50 opacity-60 blur-2xl transition group-hover:opacity-80" />
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 shadow-sm">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                        サマリ
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      {evaluation.summary}
                    </p>
                  </div>
                </div>
              )}
              {evaluation.improvementAdvice && (
                <div className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-gradient-to-br from-amber-50/50 to-white p-4 transition hover:shadow-md">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-50 opacity-60 blur-2xl transition group-hover:opacity-80" />
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                        改善提案
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">
                      {evaluation.improvementAdvice}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed category feedback */}
            {categories.length > 0 && (
              <div className="mt-6 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-white p-4">
                <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  カテゴリ別フィードバック
                </p>
                <div className="space-y-3">
                  {categories.map((c, idx) => {
                    const palette = categoryPalettes[idx % categoryPalettes.length];
                    return (
                      <div
                        key={`${c.name}-feedback`}
                        className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white/80 p-3 transition hover:bg-white hover:shadow-sm"
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${palette.gradient}`}
                        >
                          <span className="text-xs font-bold text-white tabular-nums">
                            {c.score ?? "-"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                            <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
                          </div>
                          {c.feedback && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                              {c.feedback}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!evaluation && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-orange-200 to-amber-200" />
            <p className="mt-4 text-sm text-slate-600">評価結果を待っています...</p>
          </div>
        )}
      </div>

      {/* Session Details */}
      <div className="card overflow-hidden">
        <div className="border-b border-orange-100/50 bg-gradient-to-r from-orange-50/80 to-amber-50/50 px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                {item.scenarioDiscipline ?? "Scenario"}
              </p>
              <h1 className="mt-1 text-lg font-bold text-slate-900">セッション詳細</h1>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{sessionId}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <span className="font-semibold">{item.metadata?.messageCount ?? 0}</span>
              <span>メッセージ</span>
            </div>
          </div>
        </div>

        {scenario && (
          <div className="px-5 py-3">
            <button
              type="button"
              aria-expanded={showScenarioInfo}
              onClick={() => setShowScenarioInfo((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-orange-50/50"
            >
              <span className="text-sm font-semibold text-slate-800">シナリオ情報を見る</span>
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform ${showScenarioInfo ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showScenarioInfo && (
              <div className="mt-2 space-y-3 rounded-xl bg-slate-50/80 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
                {scenario.product?.goals?.length ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                      ゴール
                    </p>
                    <ul className="mt-1 space-y-1">
                      {scenario.product.goals.map((g) => (
                        <li key={g} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {scenario.product?.problems?.length ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-rose-600">
                      背景/課題
                    </p>
                    <ul className="mt-1 space-y-1">
                      {scenario.product.problems.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Log */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-slate-900">チャットログ</h2>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto rounded-xl bg-slate-50/80 p-3">
          {item.actions?.length ? (
            item.actions.map((m, idx) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-8 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50"
                    : "mr-8 bg-white border border-slate-100"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wide ${m.role === "user" ? "text-orange-600" : "text-slate-500"}`}
                >
                  {m.role}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">{m.content}</p>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-slate-500">チャットログはありません。</p>
          )}
        </div>
      </div>

      {/* User Outputs */}
      <div className="card p-5">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between rounded-lg">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5"
                  />
                </svg>
              </div>
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
                <label className="text-xs font-semibold text-slate-600">種類</label>
                <select
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                  value={outputKind}
                  onChange={(e) => setOutputKind(e.target.value as OutputSubmissionType)}
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
                  onChange={(e) => setOutputValue(e.target.value)}
                />
              ) : (
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  placeholder={outputKind === "url" ? "https://example.com" : "https://.../image.png"}
                  value={outputValue}
                  onChange={(e) => setOutputValue(e.target.value)}
                />
              )}

              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                placeholder="補足メモ（任意）"
                value={outputNote}
                onChange={(e) => setOutputNote(e.target.value)}
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
              {outputs.map((output) => (
                <div
                  key={output.id}
                  className="rounded-xl border border-slate-200/70 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 text-sm text-slate-800">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {output.kind === "text"
                            ? "Text"
                            : output.kind === "url"
                              ? "URL"
                              : "Image"}
                        </span>
                        <span>{new Date(output.createdAt).toLocaleString()}</span>
                      </div>
                      {output.kind === "image" ? (
                        <div className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element -- allow user-provided URLs */}
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
                      {output.note ? (
                        <p className="text-xs text-slate-500">メモ: {output.note}</p>
                      ) : null}
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

      {/* Manager Comments */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-900">上長コメント</h2>
          </div>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            {(item.comments ?? []).length} 件
          </span>
        </div>

        {(item.comments ?? []).length > 0 && (
          <div className="mb-4 space-y-2">
            {item.comments!.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-violet-100/50 bg-gradient-to-br from-violet-50/50 to-white px-4 py-3"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-violet-700">{c.authorName ?? "上長"}</span>
                  <span className="text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {(item.comments ?? []).length === 0 && (
          <p className="mb-4 text-center text-xs text-slate-500 py-4">
            まだコメントはありません。
          </p>
        )}

        <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            新しいコメントを追加
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="お名前（任意）… 例: 上長"
              value={commentAuthor}
              aria-label="お名前"
              name="commentAuthor"
              autoComplete="name"
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="input-base text-sm"
            />
            <textarea
              placeholder="コメントを入力… 例: 次回はここを改善してみましょう"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              aria-label="コメント"
              name="comment"
              autoComplete="off"
              className="input-base text-sm"
              rows={3}
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              コメントを追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
