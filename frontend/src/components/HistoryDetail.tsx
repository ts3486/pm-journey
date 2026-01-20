import { addComment, listComments } from "@/services/comments";
import { exportAsJson, exportAsMarkdown } from "@/services/export";
import type { HistoryItem, ManagerComment } from "@/types/session";
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
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        セッションを選択してください。
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Session {item.sessionId.slice(0, 8)}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700"
            onClick={() => navigator.clipboard.writeText(md)}
          >
            Copy Markdown
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700"
            onClick={() => navigator.clipboard.writeText(json)}
          >
            Copy JSON
          </button>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Evaluation</div>
        <p className="text-sm text-gray-800">
          {item.evaluation?.overallScore ?? "-"} / 100 · {item.evaluation?.passing ? "Passing" : "Pending"}
        </p>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Actions</div>
        <ul className="mt-1 space-y-1 text-sm text-gray-800">
          {item.actions?.map((a) => (
            <li key={a.id} className="rounded-md bg-gray-50 px-2 py-1">
              <span className="text-xs text-gray-500">{a.tags?.join(", ") ?? ""}</span> {a.content}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">上長コメント</div>
        <div className="mt-2 space-y-2">
          {comments.length === 0 ? (
            <p className="text-xs text-gray-500">コメントはまだありません。</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{c.authorName ?? "上長"}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))
          )}
          <div className="space-y-2 rounded-md border border-gray-200 bg-white p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="お名前 (任意)"
                className="w-1/3 rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
              <input
                type="text"
                value={item.sessionId}
                readOnly
                className="w-2/3 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="コメントを入力してください"
              className="h-20 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              disabled={submitting || !content.trim()}
              onClick={handleSubmit}
              className="rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "送信中..." : "コメントを追加"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
