const getEnv = (key: string, fallback: string | undefined = undefined): string | undefined => {
  if (typeof process === "undefined") return fallback;
  const value = process.env[key];
  return value ?? fallback;
};

export const env = {
  apiBase: getEnv("NEXT_PUBLIC_API_BASE", ""),
  offlineQueue: getEnv("NEXT_PUBLIC_OFFLINE_QUEUE", "true") === "true",
  storageKeyPrefix: getEnv("NEXT_PUBLIC_STORAGE_PREFIX", "olivia_pm"),
};
