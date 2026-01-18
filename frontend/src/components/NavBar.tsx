import Link from "next/link";

type NavBarProps = {
  activeSessionId?: string;
};

export function NavBar({ activeSessionId }: NavBarProps) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">Olivia PM Simulation</span>
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
            Web
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-indigo-700">
            Home
          </Link>
          <Link href="/scenario" className="hover:text-indigo-700">
            Scenario
          </Link>
          <Link href="/history" className="hover:text-indigo-700">
            History
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            <span>{activeSessionId ? `Session: ${activeSessionId}` : "No active session"}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
