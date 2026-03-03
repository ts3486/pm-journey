import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef } from "react";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, loginWithRedirect, error } = useAuth0();
  const hasAttemptedRedirect = useRef(false);
  const redirectToLogin = useCallback(() => {
    if (hasAttemptedRedirect.current) return;
    hasAttemptedRedirect.current = true;
    void loginWithRedirect({
      appState: {
        returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      },
    });
  }, [loginWithRedirect]);

  useEffect(() => {
    if (isLoading || isAuthenticated || error) return;
    redirectToLogin();
  }, [isLoading, isAuthenticated, error, redirectToLogin]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">認証エラー</p>
          <p className="mt-1 break-all">{error.message}</p>
          <p className="mt-2 text-xs text-rose-700">
            Auth0のAllowed Callback URLs / Allowed Web Origins / Audience設定を確認してください。
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-lg font-semibold text-white shadow-[0_10px_18px_rgba(176,95,35,0.25)]">
            PJ
          </div>
          <div className="text-center">
            <div className="font-display text-lg font-semibold text-slate-900">PM Journey</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">Product Leadership</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="h-4 w-4 animate-spin text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>認証情報を確認しています</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirectToLogin();
    return null;
  }

  return <>{children}</>;
}
