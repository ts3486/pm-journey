import type { Message } from "@/types/session";

type ChatStreamProps = {
  messages: Message[];
  onTag?: (messageId: string, tags: string[]) => void;
};

export function ChatStream({ messages }: ChatStreamProps) {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {messages.length === 0 ? (
        <p className="text-sm text-gray-500">まだメッセージがありません。開始してください。</p>
      ) : (
        messages.map((m) => (
          <article
            key={m.id}
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-indigo-700">{m.role === "user" ? "You" : "鈴木"}</span>
              <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
              {m.tags && m.tags.length > 0 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  {m.tags.join(", ")}
                </span>
              )}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{m.content}</div>
          </article>
        ))
      )}
    </div>
  );
}
