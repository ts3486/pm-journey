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
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setValue("");
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card-muted space-y-3 p-4">
      <textarea
        className="input-base h-28 resize-none"
        value={value}
        disabled={disabled}
        aria-label="メッセージ入力"
        name="message"
        autoComplete="off"
        onChange={(e) => setValue(e.target.value)}
        placeholder="メッセージを入力…"
      />
      {quickPrompts && quickPrompts.length > 0 && (
        <div className="flex flex-col gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="w-full rounded-full border border-orange-200/70 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-600 text-center transition hover:border-orange-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff9f1]"
              onClick={() => setValue(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary disabled:opacity-50"
          onClick={() => void handleSend()}
          disabled={disabled || sending}
        >
          {sending ? "送信中…" : "送信"}
        </button>
      </div>
    </div>
  );
}
