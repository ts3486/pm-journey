"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getHistoryItem } from "@/services/history";
import { storage } from "@/services/storage";
import { getScenarioById } from "@/config/scenarios";
import type { HistoryItem, ManagerComment } from "@/types/session";

export default function HistoryDetailPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const scenario = useMemo(() => (item?.scenarioId ? getScenarioById(item.scenarioId) : undefined), [item?.scenarioId]);
  const [showScenarioInfo, setShowScenarioInfo] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setItem(getHistoryItem(sessionId));
  }, [sessionId]);

  if (!sessionId) {
    return <p className="text-sm text-slate-600">セッションIDが指定されていません。</p>;
  }

  if (!item) {
    return <p className="text-sm text-slate-600">セッションを読み込めませんでした。</p>;
  }

  const evaluation = item.evaluation;
  const scoreLabel =
    evaluation?.overallScore != null ? `${evaluation.overallScore} / 100` : "評価実行中または未実行";
  const categoryStyles = [
    {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      accent: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
      dot: "bg-blue-400",
    },
    {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-900",
      accent: "text-indigo-700",
      badge: "bg-indigo-100 text-indigo-700",
      dot: "bg-indigo-400",
    },
    {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      accent: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-400",
    },
    {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-900",
      accent: "text-rose-700",
      badge: "bg-rose-100 text-rose-700",
      dot: "bg-rose-400",
    },
  ];
  const categories = evaluation?.categories ?? [];
  const primaryCategories = categories.slice(0, 4);

  const handleAddComment = () => {
    if (!sessionId || !commentText.trim()) return;
    const comment: ManagerComment = {
      id: `cmt-${Math.random().toString(36).slice(2, 10)}`,
      sessionId,
      authorName: commentAuthor.trim() || "上長",
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    storage.saveComment(sessionId, comment);
    setItem((prev) =>
      prev
        ? {
            ...prev,
            comments: [...(prev.comments ?? []), comment],
          }
        : prev,
    );
    setCommentText("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="flex justify-between">
              <div><p className="text-xs font-semibold text-blue-700">{item.scenarioDiscipline ?? "Scenario"}</p>
            <h1 className="text-lg font-semibold text-slate-900">セッション: {sessionId}</h1>
            <p className="text-sm text-slate-700">メッセージ数: {item.metadata?.messageCount ?? 0}</p></div>
              <div className="self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800" >{scoreLabel}</div>
            </div>
            {scenario ? (
              <div className="mt-4 rounded-md border border-blue-50 bg-blue-50 px-3 py-3 text-xs text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-800">シナリオ情報</span>
                  <button
                    type="button"
                    aria-expanded={showScenarioInfo}
                    aria-label={showScenarioInfo ? "シナリオ情報を閉じる" : "シナリオ情報を開く"}
                    onClick={() => setShowScenarioInfo((v) => !v)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-blue-800 hover:bg-white/70"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className={`h-4 w-4 transition-transform ${showScenarioInfo ? "rotate-180" : ""}`}
                      fill="currentColor"
                    >
                      <path d="M5.4 7.6a1 1 0 0 1 1.4 0L10 10.8l3.2-3.2a1 1 0 1 1 1.4 1.4l-3.9 3.9a1 1 0 0 1-1.4 0L5.4 9a1 1 0 0 1 0-1.4z" />
                    </svg>
                  </button>
                </div>
                {showScenarioInfo ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                    <p className="text-xs text-slate-700">{scenario.description}</p>
                    {scenario.product?.goals?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-900">ゴール</p>
                        <ul className="ml-4 list-disc space-y-1">
                          {scenario.product.goals.map((g) => (
                            <li key={g} className="text-[11px]">
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {scenario.product?.problems?.length ? (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-900">背景/課題</p>
                        <ul className="ml-4 list-disc space-y-1">
                          {scenario.product.problems.map((p) => (
                            <li key={p} className="text-[11px]">
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">評価</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              {scoreLabel}
            </span>
            {evaluation?.passing != null ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  evaluation.passing ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {evaluation.passing ? "合格想定" : "改善が必要"}
              </span>
            ) : (
              <span className="text-xs text-slate-500">評価中...</span>
            )}
          </div>
        </div>
        {evaluation ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {primaryCategories.map((c, idx) => {
                const palette = categoryStyles[idx % categoryStyles.length];
                const scoreValue = c.score ?? "--";
                const scoreTone = c.score != null ? palette.text : "text-slate-400";
                return (
                  <div
                    key={c.name}
                    className={`flex aspect-square flex-col justify-between rounded-xl border p-3 shadow-sm ${palette.bg} ${palette.border}`}
                  >
                    <div className="space-y-1">
                      <p className={`text-[11px] font-semibold tracking-wide ${palette.accent}`}>カテゴリ</p>
                      <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className={`text-2xl font-semibold ${scoreTone}`}>{scoreValue}</span>
                      <span className="text-[11px] text-slate-500">/ 100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${palette.badge}`}>
                        重み {c.weight}%
                      </span>
                      <span className="text-[10px] text-slate-500">{c.score != null ? "確定" : "未確定"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {evaluation.summary ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-600">サマリ</p>
                  <p className="mt-1 text-xs text-slate-800">{evaluation.summary}</p>
                </div>
              ) : null}
              {evaluation.improvementAdvice ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-600">改善提案</p>
                  <p className="mt-1 text-xs text-slate-800">{evaluation.improvementAdvice}</p>
                </div>
              ) : null}
            </div>

            {categories.length ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-600">カテゴリ別フィードバック</p>
                <div className="mt-2 space-y-2 text-xs text-slate-800">
                  {categories.map((c, idx) => {
                    const palette = categoryStyles[idx % categoryStyles.length];
                    return (
                      <div key={`${c.name}-feedback`} className="flex items-start gap-2">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${palette.dot}`} aria-hidden="true" />
                        <div>
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-slate-600"> ・スコア {c.score ?? "-"}</span>
                          {c.feedback ? <p className="mt-1 text-slate-700">{c.feedback}</p> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

          </>
        ) : (
          <p className="text-sm text-slate-600">評価結果がまだありません。</p>
        )}
      </div>

      <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">チャットログ</h2>
        <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto">
          {item.actions?.length ? (
            item.actions.map((m) => (
              <div key={m.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <p className="text-xs text-slate-500">{m.role}</p>
                <p className="text-slate-800 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-600">チャットログはありません。</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">上長コメント</h2>
          <span className="text-[11px] text-slate-500">{(item.comments ?? []).length} 件</span>
        </div>
        {(item.comments ?? []).length ? (
          <div className="space-y-2">
            {item.comments!.map((c) => (
              <div key={c.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>{c.authorName ?? "上長"}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600">まだコメントはありません。</p>
        )}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="お名前（任意）"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddComment}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
            >
              追加
            </button>
          </div>
          <textarea
            placeholder="コメントを入力してください"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
