import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import { router } from "@/routes";
import { env } from "@/config/env";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const handleAuthRedirect = (appState?: { returnTo?: string }) => {
  const returnTo = appState?.returnTo ?? "/";
  window.history.replaceState({}, document.title, returnTo);
};

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Auth0Provider
      domain={env.auth0Domain}
      clientId={env.auth0ClientId}
      onRedirectCallback={handleAuthRedirect}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: env.auth0Audience,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Auth0Provider>
  </React.StrictMode>
);
