import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef } from "react";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, loginWithRedirect, error } = useAuth0();
  const hasAttemptedRedirect = useRef(false);

  useEffect(() => {
    if (hasAttemptedRedirect.current) return;
    if (isLoading || isAuthenticated || error) return;

    hasAttemptedRedirect.current = true;
    void loginWithRedirect();
  }, [isLoading, isAuthenticated, loginWithRedirect, error]);

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
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-slate-900">読み込み中...</div>
          <div className="text-sm text-slate-600">認証情報を確認しています</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (!hasAttemptedRedirect.current) {
      hasAttemptedRedirect.current = true;
      void loginWithRedirect();
    }
    return null;
  }

  return <>{children}</>;
}
