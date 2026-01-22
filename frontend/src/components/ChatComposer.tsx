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
    <div className="card-muted space-y-3 p-4">
      <textarea
        className="input-base h-28 resize-none"
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
      <div className="flex flex-wrap gap-2">
        {quickPrompts?.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-slate-200/70 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            onClick={() => setValue(prompt)}
          >
            {prompt}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          className="btn-primary disabled:opacity-50"
          onClick={() => void handleSend()}
          disabled={disabled || sending}
        >
          {sending ? "送信中..." : "送信"}
        </button>
      </div>
    </div>
  );
}
