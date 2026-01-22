import Link from "next/link";

type NavBarProps = {
  activeSessionId?: string;
};

export function NavBar({ activeSessionId }: NavBarProps) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-tight text-slate-900">PM Journey</span>
        </div>
        <nav className="flex items-center gap-4 text-base font-semibold text-slate-800">
          <Link href="/" className="hover:text-sky-700">
            ホーム
          </Link>
          <Link href="/scenario" className="hover:text-sky-700">
            シナリオ
          </Link>
          <Link href="/history" className="hover:text-sky-700">
            履歴
          </Link>
        </nav>
      </div>
    </header>
  );
}
