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
});
