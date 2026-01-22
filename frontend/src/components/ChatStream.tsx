import type { Message } from "@/types/session";
import { useEffect, useRef } from "react";

type ChatStreamProps = {
  messages: Message[];
  onTag?: (messageId: string, tags: string[]) => void;
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
      className="space-y-3 overflow-y-auto rounded-lg border border-sky-200 bg-white p-4 shadow-sm"
      style={{ maxHeight }}
    >
      {messages.length === 0 ? (
        <p className="text-sm text-slate-700">まだメッセージがありません。開始してください。</p>
      ) : (
        messages.map((m) => (
          <article
            key={m.id}
            className="flex items-start gap-3 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-[12px] font-semibold text-slate-700">
              <span className="leading-none">{m.role === "user" ? "U" : "鈴"}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-sky-700">{m.role === "user" ? "You" : "鈴木"}</span>
                <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                {m.tags && m.tags.length > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    {m.tags.join(", ")}
                  </span>
                )}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
