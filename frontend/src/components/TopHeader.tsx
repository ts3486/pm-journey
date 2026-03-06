import { useState } from "react";

type TopHeaderProps = {
  onMenuClick: () => void;
};

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between border-b border-[rgba(138,96,61,0.15)] px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden text-slate-700 hover:bg-orange-100/70 rounded-lg p-2"
        aria-label="メニューを開く"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="hidden lg:block relative ml-auto">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          readOnly
          placeholder="シナリオを検索..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="rounded-lg border border-[rgba(138,96,61,0.2)] bg-white/70 px-3 py-1.5 pl-9 text-sm text-slate-600 w-64 outline-none focus:border-[rgba(138,96,61,0.4)] cursor-default"
        />
        {searchFocused && (
          <p className="absolute left-0 top-full mt-1 text-xs text-slate-500 bg-white/90 border border-[rgba(138,96,61,0.15)] rounded-md px-2 py-1 whitespace-nowrap shadow-sm">
            検索機能は近日公開
          </p>
        )}
      </div>
    </header>
  );
}
