"use client";

import { useState } from "react";

type ChatComposerProps = {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  quickPrompts?: string[];
};

export function ChatComposer({ onSend, disabled, quickPrompts }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim() || sending) return;
    setSending(true);
    await onSend(value.trim());
    setValue("");
    setSending(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <textarea
        className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
        rows={3}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        placeholder="メッセージを入力..."
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {quickPrompts?.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
            onClick={() => setValue(prompt)}
          >
            {prompt}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          onClick={() => void handleSend()}
          disabled={disabled || sending}
        >
          送信
        </button>
      </div>
    </div>
  );
}
