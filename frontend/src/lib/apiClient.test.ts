import { describe, expect, it, vi, beforeEach } from "vitest";
import { createApiClient } from "@/lib/apiClient";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to build a minimal Response-like object
function makeResponse(
  status: number,
  body: unknown,
  options: { ok?: boolean } = {}
): Response {
  const isOk = options.ok ?? status >= 200 && status < 300;
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: isOk,
    status,
    text: vi.fn().mockResolvedValue(text),
    json: vi.fn().mockResolvedValue(typeof body === "string" ? JSON.parse(body) : body),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("createApiClient", () => {
  describe("request – baseUrl validation", () => {
    it("throws when baseUrl is empty", async () => {
      const client = createApiClient("");
      await expect(client.listScenarios()).rejects.toThrow("API base not configured");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("request – 401 handling", () => {
    it("calls onUnauthorized on 401 response and throws auth error", async () => {
      const onUnauthorized = vi.fn();
      const client = createApiClient("https://api.example.com", { onUnauthorized });
      mockFetch.mockResolvedValueOnce(makeResponse(401, "", { ok: false }));

      await expect(client.listScenarios()).rejects.toThrow(
        "認証の有効期限が切れました。再ログインしてください。"
      );
      expect(onUnauthorized).toHaveBeenCalledOnce();
    });

    it("does not throw if onUnauthorized is not provided", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(makeResponse(401, "", { ok: false }));

      await expect(client.listScenarios()).rejects.toThrow(
        "認証の有効期限が切れました。再ログインしてください。"
      );
    });
  });

  describe("request – error body formatting", () => {
    it("formats PLAN_REQUIRED error", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(403, { error: "PLAN_REQUIRED: upgrade needed" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "このシナリオは現在のプランでは利用できません。プランをアップグレードしてください。"
      );
    });

    it("formats FAIR_USE_LIMIT_REACHED error", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(403, { error: "FAIR_USE_LIMIT_REACHED" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "本日のフェアユース上限に達しました。時間をおいて再試行してください。"
      );
    });

    it("formats CREDIT_DAILY_LIMIT error", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(403, { error: "CREDIT_DAILY_LIMIT exceeded" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "本日のAIレビュー上限に達しました。明日再試行するか、プランを見直してください。"
      );
    });

    it("formats CREDIT_EXHAUSTED error", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(403, { error: "CREDIT_EXHAUSTED" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "AIレビュークレジットが不足しています。クレジット購入またはプラン変更をご検討ください。"
      );
    });

    it("formats RESOURCE_EXHAUSTED with retry seconds from retryDelay field", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(
          500,
          { error: 'RESOURCE_EXHAUSTED: quota exceeded retryDelay: "30s"' },
          { ok: false }
        )
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "Gemini APIの利用上限に達しました。30秒後に再試行してください。"
      );
    });

    it("formats RESOURCE_EXHAUSTED with retry seconds from 'retry in Xs' pattern", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(
          500,
          { error: "RESOURCE_EXHAUSTED: retry in 60s" },
          { ok: false }
        )
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "Gemini APIの利用上限に達しました。60秒後に再試行してください。"
      );
    });

    it("formats RESOURCE_EXHAUSTED without retry seconds when none present", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(500, { error: "RESOURCE_EXHAUSTED" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "Gemini APIの利用上限に達しました。時間をおいて再試行してください。"
      );
    });

    it("formats 429 status error without retry seconds", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(429, { error: "Too Many Requests" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "Gemini APIの利用上限に達しました。時間をおいて再試行してください。"
      );
    });

    it("formats 429 status error with retry seconds", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(429, { error: 'rate limit retryDelay: "15s"' }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "Gemini APIの利用上限に達しました。15秒後に再試行してください。"
      );
    });

    it("formats GEMINI_API_KEY is not set error", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(500, { error: "GEMINI_API_KEY is not set" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "Gemini APIキーが未設定です。backend/.env の GEMINI_API_KEY を設定してください。"
      );
    });

    it("formats evaluation returned invalid JSON error", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(
        makeResponse(500, { error: "evaluation returned invalid JSON from model" }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(
        "評価結果の生成に失敗しました（AI出力が不正な形式でした）。時間をおいて再試行してください。"
      );
    });

    it("returns short error message as-is when under 300 chars", async () => {
      const client = createApiClient("https://api.example.com");
      const shortMessage = "Something went wrong with your request.";
      mockFetch.mockResolvedValueOnce(
        makeResponse(400, { error: shortMessage }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(shortMessage);
    });

    it("falls back to raw text body when response is not JSON", async () => {
      const client = createApiClient("https://api.example.com");
      const plainText = "plain text error";
      mockFetch.mockResolvedValueOnce(
        makeResponse(400, plainText, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow(plainText);
    });

    it("returns 'Request failed: {status}' for long error messages (>=300 chars)", async () => {
      const client = createApiClient("https://api.example.com");
      const longMessage = "x".repeat(300);
      mockFetch.mockResolvedValueOnce(
        makeResponse(500, { error: longMessage }, { ok: false })
      );

      await expect(client.listScenarios()).rejects.toThrow("Request failed: 500");
    });

    it("returns 'Request failed: {status}' when error body is empty", async () => {
      const client = createApiClient("https://api.example.com");
      const res = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
        json: vi.fn(),
      } as unknown as Response;
      mockFetch.mockResolvedValueOnce(res);

      await expect(client.listScenarios()).rejects.toThrow("Request failed: 500");
    });
  });

  describe("request – successful responses", () => {
    it("returns undefined for 204 response", async () => {
      const client = createApiClient("https://api.example.com");
      const res = {
        ok: true,
        status: 204,
        text: vi.fn(),
        json: vi.fn(),
      } as unknown as Response;
      mockFetch.mockResolvedValueOnce(res);

      const result = await client.deleteSession("session-1");
      expect(result).toBeUndefined();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("parses JSON on success", async () => {
      const client = createApiClient("https://api.example.com");
      const scenarios = [{ id: "s1", title: "Scenario 1" }];
      mockFetch.mockResolvedValueOnce(makeResponse(200, scenarios));

      const result = await client.listScenarios();
      expect(result).toEqual(scenarios);
    });
  });

  describe("request – Authorization header", () => {
    it("adds Authorization header when getAccessToken is provided", async () => {
      const getAccessToken = vi.fn().mockResolvedValue("my-token");
      const client = createApiClient("https://api.example.com", { getAccessToken });
      mockFetch.mockResolvedValueOnce(makeResponse(200, []));

      await client.listScenarios();

      expect(mockFetch).toHaveBeenCalledOnce();
      const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((fetchInit.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token");
    });

    it("does not add Authorization header when getAccessToken returns empty string", async () => {
      const getAccessToken = vi.fn().mockResolvedValue("");
      const client = createApiClient("https://api.example.com", { getAccessToken });
      mockFetch.mockResolvedValueOnce(makeResponse(200, []));

      await client.listScenarios();

      const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((fetchInit.headers as Record<string, string>)["Authorization"]).toBeUndefined();
    });

    it("handles getAccessToken failure gracefully and still makes request without auth header", async () => {
      const getAccessToken = vi.fn().mockRejectedValue(new Error("token fetch failed"));
      const client = createApiClient("https://api.example.com", { getAccessToken });
      mockFetch.mockResolvedValueOnce(makeResponse(200, []));

      // Should not throw — the request proceeds without the Authorization header
      const result = await client.listScenarios();
      expect(result).toEqual([]);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((fetchInit.headers as Record<string, string>)["Authorization"]).toBeUndefined();
    });
  });

  describe("request – URL construction", () => {
    it("calls fetch with the correct URL", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(makeResponse(200, []));

      await client.listScenarios();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/scenarios",
        expect.any(Object)
      );
    });

    it("always sets Content-Type: application/json", async () => {
      const client = createApiClient("https://api.example.com");
      mockFetch.mockResolvedValueOnce(makeResponse(200, []));

      await client.listScenarios();

      const [, fetchInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((fetchInit.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json"
      );
    });
  });
});
