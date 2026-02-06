"use client";

import { addComment, listComments } from "@/services/comments";
import { exportAsJson, exportAsMarkdown } from "@/services/export";
import type { HistoryItem, ManagerComment } from "@pm-journey/types";
import { useEffect, useMemo, useState } from "react";

type HistoryDetailProps = {
  item?: HistoryItem;
};

export function HistoryDetail({ item }: HistoryDetailProps) {
  const md = useMemo(() => (item ? exportAsMarkdown(item) : ""), [item]);
  const json = useMemo(() => (item ? exportAsJson(item) : ""), [item]);
  const [comments, setComments] = useState<ManagerComment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!item?.sessionId) {
      setComments([]);
      return;
    }
    void listComments(item.sessionId).then((data) => setComments(data));
  }, [item?.sessionId]);

  const handleSubmit = async () => {
    if (!item?.sessionId || !content.trim()) return;
    setSubmitting(true);
    try {
      const saved = await addComment(item.sessionId, content.trim(), authorName.trim() || undefined);
      setComments((prev) => [...prev, saved]);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) {
    return <div className="card-muted p-6 text-sm text-slate-500">セッションを選択してください。</div>;
  }

  return (
    <div className="card space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Session Detail</p>
          <h2 className="text-lg font-semibold text-slate-900">Session {item.sessionId.slice(0, 8)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => navigator.clipboard.writeText(md)}
          >
            Copy Markdown
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => navigator.clipboard.writeText(json)}
          >
            Copy JSON
          </button>
        </div>
      </div>

      <div className="card-muted space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Evaluation</p>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-semibold text-slate-900 tabular-nums">
            {item.evaluation?.overallScore ?? "-"}
          </div>
          <span className="text-xs text-slate-500 tabular-nums">/ 100</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.evaluation?.passing ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {item.evaluation?.passing ? "Passing" : "Pending"}
          </span>
        </div>
        {item.evaluation?.categories?.length ? (
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {item.evaluation.categories.map((c) => (
              <li key={c.name} className="flex items-center justify-between rounded-xl bg-white/90 px-3 py-2">
                <span>{c.name}</span>
                <span className="text-[11px] text-slate-500">
                  {c.score ?? "-"} ({c.weight}%)
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actions</p>
        {item.actions?.length ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {item.actions.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2">
                <span className="text-[11px] text-slate-400">{a.tags?.join(", ") ?? ""}</span> {a.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">タグ付きアクションはまだありません。</p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">上長コメント</p>
        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">コメントはまだありません。</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200/70 bg-white/90 px-3 py-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{c.authorName ?? "上長"}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.content}</p>
              </div>
            ))
          )}
          <div className="card-muted space-y-2 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={authorName}
                aria-label="お名前"
                name="authorName"
                autoComplete="name"
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="お名前（任意）… 例: 山田"
                className="input-base w-1/3"
              />
              <input
                type="text"
                value={item.sessionId}
                readOnly
                aria-label="セッションID"
                name="sessionId"
                autoComplete="off"
                className="input-base w-2/3 bg-slate-100 text-xs text-slate-500"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              aria-label="コメント"
              name="comment"
              autoComplete="off"
              placeholder="コメントを入力… 例: 判断の背景を共有"
              className="input-base h-24"
            />
            <button
              type="button"
              disabled={submitting || !content.trim()}
              onClick={handleSubmit}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? "送信中…" : "コメントを追加"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
