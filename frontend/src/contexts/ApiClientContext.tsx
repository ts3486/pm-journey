import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { createApiClient, type ApiClient } from "@/lib/apiClient";
import { env } from "@/config/env";
import { setApiClient } from "@/services/api";

const ApiClientContext = createContext<ApiClient | null>(null);

type ApiClientProviderProps = {
  children: React.ReactNode;
};

const reauthErrorCodes = new Set([
  "consent_required",
  "invalid_grant",
  "invalid_token",
  "login_required",
  "missing_refresh_token",
  "session_expired",
]);

const currentReturnTo = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

const readAuthErrorCode = (error: unknown): string | null => {
  if (!error || typeof error !== "object" || !("error" in error)) return null;
  const value = (error as { error?: unknown }).error;
  return typeof value === "string" ? value : null;
};

export function ApiClientProvider({ children }: ApiClientProviderProps) {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const hasTriggeredReauth = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (hasTriggeredReauth.current) return;
    hasTriggeredReauth.current = true;
    void loginWithRedirect({
      appState: { returnTo: currentReturnTo() },
    });
  }, [loginWithRedirect]);

  useEffect(() => {
    if (isAuthenticated) {
      hasTriggeredReauth.current = false;
    }
  }, [isAuthenticated]);

  const apiClient = useMemo(() => {
    return createApiClient(env.apiBase, {
      getAccessToken: async () => {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: env.auth0Audience,
            },
          });
          return token;
        } catch (error) {
          console.error("Error getting access token:", error);
          const errorCode = readAuthErrorCode(error);
          if (errorCode && reauthErrorCodes.has(errorCode)) {
            redirectToLogin();
          }
          return "";
        }
      },
      onUnauthorized: redirectToLogin,
    });
  }, [getAccessTokenSilently, redirectToLogin]);

  useEffect(() => {
    setApiClient(apiClient);
  }, [apiClient]);

  return <ApiClientContext.Provider value={apiClient}>{children}</ApiClientContext.Provider>;
}

export function useApi(): ApiClient {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error("useApi must be used within ApiClientProvider");
  }
  return context;
}
