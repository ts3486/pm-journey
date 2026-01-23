import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white shadow-sm">
            PJ
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold text-slate-900">PM Journey</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Product leadership</div>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link href="/" className="rounded-md px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
            ホーム
          </Link>
          <Link href="/scenario" className="rounded-md px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
            シナリオ
          </Link>
          <Link href="/history" className="rounded-md px-4 py-2 transition hover:bg-slate-100 hover:text-slate-900">
            履歴
          </Link>
        </nav>
      </div>
    </header>
  );
}
