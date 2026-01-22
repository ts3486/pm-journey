"use client";

import { HistoryDetail } from "@/components/HistoryDetail";
import { getScenarioById } from "@/config/scenarios";
import { listHistory } from "@/services/history";
import type { HistoryItem, ScenarioDiscipline } from "@/types/session";
import { useEffect, useMemo, useState } from "react";

const disciplineBadge = (discipline?: ScenarioDiscipline) => {
  if (discipline === "CHALLENGE") return "bg-rose-50 text-rose-700";
  return "bg-emerald-50 text-emerald-700";
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    void listHistory().then((data) => setItems(data));
  }, []);

  useEffect(() => {
    if (!activeId && items.length > 0) {
      setActiveId(items[0].sessionId);
    }
  }, [items, activeId]);

  const activeItem = useMemo(
    () => items.find((item) => item.sessionId === activeId),
    [items, activeId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">History</p>
          <h1 className="font-display text-2xl text-slate-900">シナリオ履歴</h1>
        </div>
        <span className="text-xs text-slate-500">
          {items.length} session{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="card-muted p-6 text-sm text-slate-500">履歴がありません。</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {items.map((item) => {
              const scenarioTitle = getScenarioById(item.scenarioId ?? "")?.title ?? item.scenarioId ?? "Scenario";
              const isActive = item.sessionId === activeId;
              return (
                <button
                  key={item.sessionId}
                  type="button"
                  onClick={() => setActiveId(item.sessionId)}
                  className={`card w-full text-left transition ${
                    isActive ? "ring-2 ring-teal-200" : "hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{scenarioTitle}</p>
                      <div className="text-base font-semibold text-slate-900">
                        Session {item.sessionId.slice(0, 8)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.metadata?.messageCount ?? 0} messages ·{" "}
                        {item.evaluation?.passing ? "Passing" : "Pending"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${disciplineBadge(item.scenarioDiscipline)}`}>
                        {item.scenarioDiscipline ?? "BASIC"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {item.evaluation?.overallScore != null ? `${item.evaluation.overallScore} / 100` : "No score"}
                      </span>
                    </div>
                  </div>
                  {item.actions?.length ? (
                    <div className="px-5 pb-5 text-xs text-slate-600">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Highlights</p>
                      <ul className="mt-2 space-y-1">
                        {item.actions.slice(0, 2).map((a) => (
                          <li key={a.id} className="truncate">
                            {a.content}
                          </li>
                        ))}
                        {item.actions.length > 2 ? (
                          <li className="text-[11px] text-slate-400">…{item.actions.length - 2} more</li>
                        ) : null}
                      </ul>
                    </div>
                  ) : (
                    <div className="px-5 pb-5 text-xs text-slate-400">No actions recorded.</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="lg:sticky lg:top-24">
            <HistoryDetail item={activeItem} />
          </div>
        </div>
      )}
    </div>
  );
}
