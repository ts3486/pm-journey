const fallbackApiBase =
  process.env.NODE_ENV !== "production" ? "http://localhost:3001" : "";

export const env = {
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? fallbackApiBase,
  offlineQueue: (process.env.NEXT_PUBLIC_OFFLINE_QUEUE ?? "true") === "true",
  storageKeyPrefix: process.env.NEXT_PUBLIC_STORAGE_PREFIX ?? "olivia_pm",
  geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
};
