import Image from "next/image";
import Link from "next/link";

export function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-200/70 bg-[#fff7ec]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center transition hover:opacity-80">
          <Image
            src="/logo-with-title.png"
            alt="PM Journey"
            width={180}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link
            href="/"
            className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
          >
            ホーム
          </Link>
          <Link
            href="/scenario"
            className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
          >
            シナリオ
          </Link>
          <Link
            href="/history"
            className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
          >
            履歴
          </Link>
        </nav>
      </div>
    </header>
  );
}
