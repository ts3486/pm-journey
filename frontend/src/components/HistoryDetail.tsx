import { exportAsJson, exportAsMarkdown } from "@/services/export";
import type { HistoryItem } from "@/types/session";
import { useMemo } from "react";

type HistoryDetailProps = {
  item?: HistoryItem;
};

export function HistoryDetail({ item }: HistoryDetailProps) {
  const md = useMemo(() => (item ? exportAsMarkdown(item) : ""), [item]);
  const json = useMemo(() => (item ? exportAsJson(item) : ""), [item]);

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
    </div>
  );
}
