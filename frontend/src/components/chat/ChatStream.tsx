import type { Message } from "@/types";
import { useEffect, useRef } from "react";

type ChatStreamProps = {
  messages: Message[];
  maxHeight?: string;
  isTyping?: boolean;
};

export function ChatStream({ messages, maxHeight = "60vh", isTyping = false }: ChatStreamProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      // Scroll to top for initial message, bottom for subsequent messages
      if (messages.length > 0 && prevMessagesLengthRef.current === 0) {
        el.scrollTop = 0;
      } else if (messages.length > prevMessagesLengthRef.current) {
        el.scrollTop = el.scrollHeight;
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages, isTyping]);

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
          const badgeLabel = isUser ? "YOU" : "A";
          const nameLabel = isUser ? "You" : "Agent";
          const visibleTags = (m.tags ?? []).filter((tag) => tag !== "summary");
          return (
            <article
              key={m.id}
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-sm ${
                isUser
                  ? "border-orange-200/70 bg-orange-50/70 text-slate-900"
                  : "border-cyan-200/70 bg-cyan-50/70 text-slate-800"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold ${
                  isUser ? "bg-orange-600 text-white" : "bg-cyan-600 text-white"
                }`}
              >
                <span className="leading-none">{badgeLabel}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                  <span className="font-semibold text-slate-700">{nameLabel}</span>
                  <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  {visibleTags.length > 0 && (
                    <span className="rounded-full bg-orange-100/80 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                      {visibleTags.join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
              </div>
            </article>
          );
        })
      )}
      {isTyping ? (
        <article className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 text-sm text-slate-700">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-600 text-[11px] font-semibold text-white">
            <span className="leading-none">A</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              <span className="font-semibold text-slate-700">Agent</span>
              <span>typing…</span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
