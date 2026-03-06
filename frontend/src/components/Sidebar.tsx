import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { env } from "@/config/env";
import { useStorage } from "@/contexts/StorageContext";
import { canViewTeamManagement } from "@/lib/teamAccess";
import { useCurrentOrganization } from "@/queries/organizations";
import { SESSION_POINTER_CHANGED_EVENT } from "@/storage/sessionPointer";

type SidebarProps = {
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ isCollapsed, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth0();
  const storage = useStorage();
  const { data: currentOrganization } = useCurrentOrganization();
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const currentOrganizationRole = currentOrganization?.membership?.role ?? null;
  const showTeamManagementButton = canViewTeamManagement(currentOrganizationRole);

  useEffect(() => {
    const checkActiveSession = async () => {
      const sessionId = await storage.loadLastSessionId();
      setHasActiveSession(!!sessionId);
    };

    checkActiveSession();

    const handleSessionChange = () => {
      checkActiveSession();
    };

    window.addEventListener(SESSION_POINTER_CHANGED_EVENT, handleSessionChange);
    window.addEventListener("focus", handleSessionChange);

    return () => {
      window.removeEventListener(SESSION_POINTER_CHANGED_EVENT, handleSessionChange);
      window.removeEventListener("focus", handleSessionChange);
    };
  }, [storage]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navLinkClass = (path: string) => {
    const active = isActive(path);
    return [
      "flex items-center gap-3 px-4 py-3 transition-colors",
      isCollapsed ? "justify-center px-0" : "",
      active
        ? "bg-[rgba(217,119,42,0.25)] border-l-[3px] border-orange-500"
        : "border-l-[3px] border-transparent hover:bg-[rgba(217,119,42,0.15)]",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-60";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          sidebarWidth,
          "h-screen sticky top-0 flex flex-col bg-[#3d2a1a] text-[#f5e6d3]",
          "fixed left-0 top-0 z-50 lg:static lg:translate-x-0 transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className={["flex items-center gap-3 p-4", isCollapsed ? "justify-center px-2" : ""].join(" ")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 font-bold text-white">
            PJ
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="truncate font-semibold text-[#f5e6d3]">PM Journey</div>
              <div className="truncate text-xs text-[#c4a882]">Product Leadership</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5">
            <li>
              <Link
                to="/"
                className={navLinkClass("/")}
                aria-current={isActive("/") ? "page" : undefined}
                title={isCollapsed ? "ロードマップ" : undefined}
                onClick={handleLinkClick}
              >
                <span className="shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>
                </span>
                {!isCollapsed && <span className="truncate">ロードマップ</span>}
              </Link>
            </li>

            <li>
              <Link
                to="/scenario"
                className={navLinkClass("/scenario")}
                aria-current={isActive("/scenario") ? "page" : undefined}
                title={isCollapsed ? "進行中のシナリオ" : undefined}
                onClick={handleLinkClick}
              >
                <span className="relative shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {hasActiveSession && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-500" />
                  )}
                </span>
                {!isCollapsed && (
                  <span className="flex flex-1 items-center gap-2 truncate">
                    進行中のシナリオ
                    {hasActiveSession && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    )}
                  </span>
                )}
              </Link>
            </li>

            <li>
              <Link
                to="/history"
                className={navLinkClass("/history")}
                aria-current={isActive("/history") ? "page" : undefined}
                title={isCollapsed ? "進捗" : undefined}
                onClick={handleLinkClick}
              >
                <span className="shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </span>
                {!isCollapsed && <span className="truncate">進捗</span>}
              </Link>
            </li>

            <li>
              <Link
                to="/achievements"
                className={navLinkClass("/achievements")}
                aria-current={isActive("/achievements") ? "page" : undefined}
                title={isCollapsed ? "実績" : undefined}
                onClick={handleLinkClick}
              >
                <span className="shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14M9 3v2a3 3 0 003 3m0 0a3 3 0 003-3V3m-3 5v4m-4 0h8m-8 0a4 4 0 00-4 4h16a4 4 0 00-4-4m-8 0V8" /></svg>
                </span>
                {!isCollapsed && <span className="truncate">実績</span>}
              </Link>
            </li>

            {showTeamManagementButton && (
              <li>
                <Link
                  to="/settings/team"
                  className={navLinkClass("/settings/team")}
                  aria-current={isActive("/settings/team") ? "page" : undefined}
                  title={isCollapsed ? "チーム管理" : undefined}
                  onClick={handleLinkClick}
                >
                  <span className="shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  {!isCollapsed && <span className="truncate">チーム管理</span>}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="relative mt-auto border-t border-[rgba(245,230,211,0.1)] p-3">
          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              role="menu"
              className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-[rgba(245,230,211,0.15)] bg-[#3d2a1a] py-1 shadow-lg"
            >
              <Link
                to="/settings"
                role="menuitem"
                className="flex w-full items-center px-4 py-2 text-sm text-[#f5e6d3] hover:bg-[rgba(217,119,42,0.15)]"
                onClick={() => {
                  setProfileMenuOpen(false);
                  handleLinkClick();
                }}
              >
                プロンプト設定
              </Link>
              <Link
                to="/settings/account"
                role="menuitem"
                className="flex w-full items-center px-4 py-2 text-sm text-[#f5e6d3] hover:bg-[rgba(217,119,42,0.15)]"
                onClick={() => {
                  setProfileMenuOpen(false);
                  handleLinkClick();
                }}
              >
                アカウント情報
              </Link>
              {env.billingEnabled && (
                <Link
                  to="/settings/billing"
                  role="menuitem"
                  className="flex w-full items-center px-4 py-2 text-sm text-[#f5e6d3] hover:bg-[rgba(217,119,42,0.15)]"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLinkClick();
                  }}
                >
                  請求設定
                </Link>
              )}
              {env.billingEnabled && (
                <Link
                  to="/pricing"
                  role="menuitem"
                  className="flex w-full items-center px-4 py-2 text-sm text-[#f5e6d3] hover:bg-[rgba(217,119,42,0.15)]"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLinkClick();
                  }}
                >
                  料金
                </Link>
              )}
              <button
                role="menuitem"
                className="flex w-full items-center px-4 py-2 text-sm text-[#f5e6d3] hover:bg-[rgba(217,119,42,0.15)]"
                onClick={() => {
                  setProfileMenuOpen(false);
                  logout({ logoutParams: { returnTo: window.location.origin } });
                }}
              >
                ログアウト
              </button>
            </div>
          )}

          <button
            ref={profileButtonRef}
            aria-label="プロフィールメニューを開く"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            className={[
              "flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[rgba(217,119,42,0.15)]",
              isCollapsed ? "justify-center" : "",
            ].join(" ")}
            onClick={() => setProfileMenuOpen((prev) => !prev)}
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name ?? "ユーザー"}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            {!isCollapsed && (
              <span className="truncate text-sm text-[#f5e6d3]">
                {user?.name ?? user?.email ?? "ユーザー"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
