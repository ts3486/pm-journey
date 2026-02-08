import { Link } from "react-router-dom";

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-200/70 bg-[#fff7ec]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(176,95,35,0.25)]">
            PJ
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold text-slate-900">PM Journey</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Product Leadership</div>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link
            to="/"
            className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
          >
            シナリオ一覧
          </Link>
          <Link
            to="/history"
            className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
          >
            履歴
          </Link>
          <Link
            to="/scenario"
            className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
          >
            進行中のシナリオ
          </Link>
          <Link
            to="/settings"
            className="rounded-md p-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
            title="設定"
          >
            プロジェクト設定
          </Link>
        </nav>
      </div>
    </header>
  );
}
