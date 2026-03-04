import { describe, expect, it, vi } from "vitest";
import { getHistoryItem, listHistory } from "@/services/history";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    listSessions: vi.fn(),
    getSession: vi.fn(),
  },
}));

const listSessionsMock = vi.mocked(api.listSessions);
const getSessionMock = vi.mocked(api.getSession);

describe("history service", () => {
  it("listHistory delegates to listSessions", async () => {
    listSessionsMock.mockResolvedValueOnce([]);

    const result = await listHistory();

    expect(result).toEqual([]);
    expect(listSessionsMock).toHaveBeenCalledTimes(1);
  });

  it("getHistoryItem returns null on session-not-found errors", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("session not found"));

    const result = await getHistoryItem("session_missing");

    expect(result).toBeNull();
  });

  it("getHistoryItem rethrows non-not-found errors", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("認証の有効期限が切れました。再ログインしてください。"));

    await expect(getHistoryItem("session_auth")).rejects.toThrow("認証の有効期限が切れました");
  });

  it("getHistoryItem returns null on 'Request failed: 404' errors", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("Request failed: 404"));

    const result = await getHistoryItem("session_404");

    expect(result).toBeNull();
  });

  it("getHistoryItem returns null on 'Session Not Found' (case-insensitive)", async () => {
    getSessionMock.mockRejectedValueOnce(new Error("Session Not Found"));

    const result = await getHistoryItem("session_case");

    expect(result).toBeNull();
  });

  it("getHistoryItem returns the history item on success", async () => {
    const item = {
      sessionId: "session_ok",
      metadata: { messageCount: 3, startedAt: "2026-03-04T00:00:00Z" },
      actions: [],
    };
    getSessionMock.mockResolvedValueOnce(item);

    const result = await getHistoryItem("session_ok");

    expect(result).toEqual(item);
  });

  it("getHistoryItem rethrows non-Error objects", async () => {
    getSessionMock.mockRejectedValueOnce("unexpected string error");

    await expect(getHistoryItem("session_string")).rejects.toBe("unexpected string error");
  });

  it("listHistory returns the items from the API", async () => {
    const items = [
      {
        sessionId: "session_1",
        metadata: { messageCount: 5, startedAt: "2026-03-04T00:00:00Z" },
        actions: [],
      },
      {
        sessionId: "session_2",
        metadata: { messageCount: 2, startedAt: "2026-03-04T01:00:00Z" },
        actions: [],
      },
    ];
    listSessionsMock.mockResolvedValueOnce(items);

    const result = await listHistory();

    expect(result).toEqual(items);
    expect(result).toHaveLength(2);
  });
});
