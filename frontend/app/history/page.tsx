"use client";

import { listHistory } from "@/services/history";
import type { HistoryItem } from "@/types/session";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    void listHistory().then((data) => setItems(data));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">History</h1>
        <span className="text-xs text-gray-500">
          {items.length} session{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">履歴がありません。</p>
      ) : (
        <div className="space-y-3">
          {items.map((item: HistoryItem) => (
            <div key={item.sessionId} className="rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Session {item.sessionId.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {item.metadata?.messageCount ?? 0} messages ·{" "}
                    {item.evaluation?.passing ? "Passing" : "Pending"}
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {item.evaluation?.overallScore != null ? `${item.evaluation.overallScore} / 100` : "No score"}
                </span>
              </div>
              {item.actions?.length ? (
                <ul className="mt-2 space-y-1">
                  {item.actions.slice(0, 3).map((a) => (
                    <li key={a.id} className="truncate text-xs text-gray-700">
                      {a.content}
                    </li>
                  ))}
                  {item.actions.length > 3 ? (
                    <li className="text-[11px] text-gray-500">…{item.actions.length - 3} more</li>
                  ) : null}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No actions recorded.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
