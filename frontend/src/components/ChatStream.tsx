"use client";

import type { Message } from "@/types/session";
import { useEffect, useRef } from "react";

type ChatStreamProps = {
  messages: Message[];
  maxHeight?: string;
};

export function ChatStream({ messages, maxHeight = "60vh" }: ChatStreamProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="space-y-3 overflow-y-auto rounded-2xl border border-orange-200/70 bg-white/85 p-4 shadow-[0_16px_36px_rgba(120,71,34,0.12)]"
      style={{ maxHeight }}
    >
      {messages.length === 0 ? (
        <p className="text-sm text-slate-600">まだメッセージがありません。開始してください。</p>
      ) : (
        messages.map((m) => {
          const isUser = m.role === "user";
          const isSystem = m.role === "system";
          return (
            <article
              key={m.id}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${
                isSystem
                  ? "border-slate-200/80 bg-slate-50/80 text-slate-700"
                  : isUser
                    ? "border-orange-200/70 bg-orange-50/70 text-slate-900"
                    : "border-slate-200/80 bg-white text-slate-900"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold ${
                  isSystem ? "bg-slate-300 text-slate-700" : isUser ? "bg-orange-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                <span className="leading-none">{isSystem ? "SYS" : isUser ? "YOU" : "鈴"}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                  <span className="font-semibold text-slate-700">{isSystem ? "System" : isUser ? "You" : "鈴木"}</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  {m.tags && m.tags.length > 0 && (
                    <span className="rounded-full bg-orange-100/80 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                      {m.tags.join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
