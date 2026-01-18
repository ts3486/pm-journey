"use client";

import { HistoryDetail } from "@/components/HistoryDetail";
import { DataRetentionNotice } from "@/components/DataRetentionNotice";
import { listHistory } from "@/services/history";
import type { HistoryItem } from "@/types/session";
import { useEffect, useMemo, useState } from "react";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void listHistory().then((data) => setItems(data));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!query) return true;
      return item.actions?.some((a) => a.content.toLowerCase().includes(query.toLowerCase()));
    });
  }, [items, query]);

  const active: HistoryItem | undefined =
    filtered.find((i) => i.sessionId === selected) ?? filtered[0];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">History</h1>
          <input
            type="search"
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
            placeholder="検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">履歴がありません。</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-800">
            {filtered.map((item: HistoryItem) => (
              <li
                key={item.sessionId}
                className={`cursor-pointer rounded-md border px-3 py-2 ${
                  active?.sessionId === item.sessionId ? "border-indigo-300 bg-indigo-50" : "border-gray-200"
                }`}
                onClick={() => setSelected(item.sessionId)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Session {item.sessionId.slice(0, 6)}</span>
                  <span className="text-xs text-gray-500">
                    {item.evaluation?.overallScore ? `${item.evaluation.overallScore} / 100` : "No score"}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {item.evaluation?.passing ? "Passing" : "Pending"} ·{" "}
                  {item.metadata?.messageCount ?? 0} messages
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="lg:col-span-2">
        <HistoryDetail item={active} />
        <div className="mt-4">
          <DataRetentionNotice />
        </div>
      </div>
    </div>
  );
}
