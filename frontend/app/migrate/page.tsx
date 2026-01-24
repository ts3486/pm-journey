"use client";

import { env } from "@/config/env";
import { storage, type SessionSnapshot } from "@/services/storage";
import { useState } from "react";

type MigrationStatus = "idle" | "scanning" | "uploading" | "done" | "error";

interface MigrationProgress {
  imported: number;
  total: number;
  failed: string[];
}

export default function MigratePage() {
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [progress, setProgress] = useState<MigrationProgress>({ imported: 0, total: 0, failed: [] });
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function getAllLocalSessions(): Promise<SessionSnapshot[]> {
    if (typeof window === "undefined") return [];

    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(env.storageKeyPrefix + ":session:")
    );

    const sessions: SessionSnapshot[] = [];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const snapshot = JSON.parse(raw) as SessionSnapshot;
        sessions.push(snapshot);
      } catch (error) {
        console.warn("Skipping invalid session", { key, error });
      }
    }

    return sessions;
  }

  async function migrateData() {
    try {
      setStatus("scanning");
      setErrorMessage("");

      // Get all sessions from localStorage
      const sessions = await getAllLocalSessions();
      setProgress({ imported: 0, total: sessions.length, failed: [] });

      if (sessions.length === 0) {
        setErrorMessage("No sessions found in localStorage to migrate.");
        setStatus("error");
        return;
      }

      setStatus("uploading");

      // Upload to backend
      const apiBase = env.apiBase || "http://localhost:3001";
      const res = await fetch(`${apiBase}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Migration failed: ${res.status} ${errorText}`);
      }

      const result = (await res.json()) as { imported: number; failed: string[] };
      setProgress({ imported: result.imported, total: sessions.length, failed: result.failed });

      if (result.failed.length === 0) {
        setStatus("done");
      } else {
        setStatus("error");
        setErrorMessage(`${result.failed.length} sessions failed to import. See details below.`);
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }

  function clearLocalStorage() {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm(
      "Are you sure you want to clear all local storage? This cannot be undone. Make sure your data has been successfully migrated first."
    );
    if (!confirmed) return;

    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(env.storageKeyPrefix)
    );
    keys.forEach((k) => localStorage.removeItem(k));
    alert("Local storage cleared successfully.");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Migration</p>
        <h1 className="font-display text-2xl text-slate-900">Migrate to Cloud Storage</h1>
        <p className="mt-2 text-sm text-slate-600">
          Transfer your session data from browser localStorage to the PostgreSQL database.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        {status === "idle" && (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">Ready to Migrate</h2>
              <p className="text-sm text-slate-600">
                Click the button below to scan your localStorage and upload all session data to the database.
              </p>
              {!env.apiBase && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Warning: API base URL is not configured. Please set NEXT_PUBLIC_API_BASE environment variable.
                </div>
              )}
            </div>
            <button
              onClick={migrateData}
              disabled={!env.apiBase}
              className="btn-primary"
            >
              Start Migration
            </button>
          </>
        )}

        {status === "scanning" && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Scanning...</h2>
            <p className="text-sm text-slate-600">Finding sessions in localStorage...</p>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600 animate-pulse" style={{ width: "30%" }} />
            </div>
          </div>
        )}

        {status === "uploading" && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Uploading...</h2>
            <p className="text-sm text-slate-600">
              Uploading {progress.imported}/{progress.total} sessions
            </p>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${(progress.imported / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h2 className="text-lg font-semibold text-green-900">Migration Complete!</h2>
              <p className="mt-1 text-sm text-green-700">
                Successfully migrated {progress.imported} session{progress.imported !== 1 ? "s" : ""}.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Your data is now stored in the database. You can optionally clear your localStorage to free up space.
              </p>
              <button onClick={clearLocalStorage} className="btn-secondary">
                Clear localStorage
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h2 className="text-lg font-semibold text-red-900">Migration Error</h2>
              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              {progress.failed.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-red-900">Failed Sessions:</p>
                  <ul className="mt-1 list-disc list-inside text-xs text-red-700">
                    {progress.failed.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button onClick={() => setStatus("idle")} className="btn-secondary">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
