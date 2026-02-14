const fallbackApiBase =
  import.meta.env.MODE !== "production" ? "http://localhost:3001" : "";

const envFlag = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return fallback;
};

export const env = {
  apiBase: import.meta.env.VITE_API_BASE_URL ?? fallbackApiBase,
  storageKeyPrefix: import.meta.env.VITE_STORAGE_PREFIX ?? "olivia_pm",
  auth0Domain: import.meta.env.VITE_AUTH0_DOMAIN ?? "",
  auth0ClientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? "",
  auth0Audience: import.meta.env.VITE_AUTH0_AUDIENCE ?? "",
  billingEnabled: envFlag(import.meta.env.VITE_BILLING_ENABLED, true),
};
