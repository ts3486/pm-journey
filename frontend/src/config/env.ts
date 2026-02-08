const fallbackApiBase =
  import.meta.env.MODE !== "production" ? "http://localhost:3001" : "";

export const env = {
  apiBase: import.meta.env.VITE_API_BASE_URL ?? fallbackApiBase,
  storageKeyPrefix: import.meta.env.VITE_STORAGE_PREFIX ?? "olivia_pm",
  auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN ?? "",
  auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? "",
  auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE ?? "",
};
