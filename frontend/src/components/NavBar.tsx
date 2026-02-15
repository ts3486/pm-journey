import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { env } from "@/config/env";
import { useStorage } from "@/contexts/StorageContext";
import { canViewTeamManagement } from "@/lib/teamAccess";
import { useCurrentOrganization } from "@/queries/organizations";
import { SESSION_POINTER_CHANGED_EVENT } from "@/storage/sessionPointer";

export function NavBar() {
  const { user, logout } = useAuth0();
  const { data: currentOrganization } = useCurrentOrganization();
  const storage = useStorage();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const currentOrganizationRole = currentOrganization?.membership.role ?? null;
  const showTeamManagementButton = canViewTeamManagement(currentOrganizationRole);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () =>
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });

  useEffect(() => {
    let cancelled = false;

    const syncActiveSession = async () => {
      const sessionId = await storage.loadLastSessionId();
      if (!cancelled) {
        setHasActiveSession(Boolean(sessionId));
      }
    };

    const handleStorageChange = () => {
      void syncActiveSession();
    };

    void syncActiveSession();
    window.addEventListener(SESSION_POINTER_CHANGED_EVENT, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_POINTER_CHANGED_EVENT, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, [location.pathname, storage]);

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
            ロードマップ
          </Link>
                    {user && showTeamManagementButton ? (
            <Link
              to="/settings/team"
              className="rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
            >
              チーム管理
            </Link>
          ) : null}
          <Link
            to="/scenario"
            className={`rounded-md px-4 py-2 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec] ${
              hasActiveSession ? "bg-orange-200/80 text-slate-900 shadow-[0_8px_18px_rgba(176,95,35,0.18)]" : ""
            }`}
          >
            進行中のシナリオ
          </Link>
          {user && (
            <div ref={profileMenuRef} className="relative ml-4 border-l border-orange-200/70 pl-4">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full p-1 transition hover:bg-orange-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff7ec]"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="プロフィールメニューを開く"
              >
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className="h-8 w-8 rounded-full border-2 border-orange-200/70"
                  />
                )}
              </button>
              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 rounded-xl border border-orange-200/80 bg-[#fff7ec] p-1.5 shadow-[0_14px_28px_rgba(176,95,35,0.2)]"
                >
                  <Link
                    to="/history"
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80"
                  >
                    履歴
                  </Link>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80"
                  >
                    プロンプト設定
                  </Link>
                  <Link
                    to="/settings/account"
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80"
                  >
                    アカウント情報
                  </Link>
                  {env.billingEnabled ? (
                    <>
                      <Link
                        to="/settings/billing"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80"
                      >
                        請求設定
                      </Link>
                      <Link
                        to="/pricing"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80"
                      >
                        料金
                      </Link>
                    </>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-100/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/80"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
