"use client";

import type { Message, MessageTag } from "@/types/session";

type ActionLogProps = {
  messages: Message[];
  onUpdateTags: (messageId: string, tags: MessageTag[]) => void;
};

const tagOptions: MessageTag[] = ["decision", "assumption", "risk", "next_action", "summary"];

export function ActionLog({ messages, onUpdateTags }: ActionLogProps) {
  const tagged = messages.filter((m) => m.tags && m.tags.length > 0);
  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm">
      <div className="text-xs font-semibold text-gray-600">Action Log</div>
      {tagged.length === 0 ? (
        <p className="text-xs text-gray-500">まだタグ付きメッセージはありません。</p>
      ) : (
        <ul className="space-y-1">
          {tagged.map((m) => (
            <li key={m.id} className="rounded-md bg-gray-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                <div className="flex flex-wrap gap-1">
                  {m.tags?.map((t) => (
                    <span key={t} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-800">{m.content}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-gray-200 pt-2 text-xs text-gray-600">タグを追加:</div>
      <div className="flex flex-wrap gap-1">
        {messages.map((m) => (
          <button
            key={m.id}
            type="button"
            className="rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100"
            onClick={() => onUpdateTags(m.id, m.tags ?? tagOptions.slice(0, 1))}
          >
            {m.role === "user" ? "ユーザー" : "鈴木"}: {m.content.slice(0, 20)}...
          </button>
        ))}
      </div>
    </div>
  );
}
