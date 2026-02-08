import { createContext, useContext, useEffect, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { createApiClient, type ApiClient } from "@/lib/apiClient";
import { env } from "@/config/env";
import { setApiClient } from "@/services/api";

const ApiClientContext = createContext<ApiClient | null>(null);

type ApiClientProviderProps = {
  children: React.ReactNode;
};

export function ApiClientProvider({ children }: ApiClientProviderProps) {
  const { getAccessTokenSilently } = useAuth0();

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
          return "";
        }
      },
    });
  }, [getAccessTokenSilently]);

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
