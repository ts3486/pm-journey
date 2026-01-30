import { env } from "@/config/env";
import type {
  Evaluation,
  HistoryItem,
  Message,
  MessageRole,
  MessageTag,
  ManagerComment,
  MissionStatus,
  Session,
  RatingCriterion,
  Scenario,
  TestCase,
} from "@/types/session";

const base = env.apiBase;

type FetchOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  if (!base) {
    throw new Error("API base not configured");
  }
  const res = await fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const rawText = await res.text();
    let detail = rawText;
    try {
      const parsed = rawText ? JSON.parse(rawText) : null;
      if (parsed && typeof parsed.error === "string") {
        detail = parsed.error;
      }
    } catch {
      // ignore JSON parse failures
    }
    const formatError = (status: number, message: string) => {
      const retrySecondsMatch = message.match(/retryDelay\"?:\\s*\"(\\d+)s\"/) ??
        message.match(/retry in ([0-9.]+)s/i);
      const retrySeconds = retrySecondsMatch ? Number(retrySecondsMatch[1]) : null;
      if (status === 429 || /RESOURCE_EXHAUSTED|Quota exceeded|Too Many Requests/i.test(message)) {
        return `Gemini APIの利用上限に達しました。${retrySeconds ? `${retrySeconds}秒後に再試行してください。` : "時間をおいて再試行してください。"}`;
      }
      if (/GEMINI_API_KEY is not set/i.test(message)) {
        return "Gemini APIキーが未設定です。backend/.env の GEMINI_API_KEY を設定してください。";
      }
      if (/evaluation returned invalid JSON/i.test(message)) {
        return "評価結果の生成に失敗しました（AI出力が不正な形式でした）。時間をおいて再試行してください。";
      }
      if (message && message.length < 300) {
        return message;
      }
      return `Request failed: ${status}`;
    };
    throw new Error(formatError(res.status, detail));
  }
  return (await res.json()) as T;
}

export const api = {
  async createScenario(payload: Scenario): Promise<Scenario> {
    return request<Scenario>("/scenarios", { method: "POST", body: payload });
  },
  async createSession(scenarioId: string): Promise<Session> {
    return request<Session>("/sessions", { method: "POST", body: { scenarioId } });
  },
  async listSessions(): Promise<HistoryItem[]> {
    return request<HistoryItem[]>("/sessions");
  },
  async getSession(id: string): Promise<HistoryItem> {
    return request<HistoryItem>(`/sessions/${id}`);
  },
  async listMessages(sessionId: string): Promise<Message[]> {
    return request<Message[]>(`/sessions/${sessionId}/messages`);
  },
  async deleteSession(id: string): Promise<void> {
    await request(`/sessions/${id}`, { method: "DELETE" });
  },
  async postMessage(
    sessionId: string,
    role: MessageRole,
    content: string,
    tags?: MessageTag[],
    missionStatus?: MissionStatus[],
    agentContext?: {
      systemPrompt: string;
      scenarioPrompt: string;
      scenarioTitle?: string;
      scenarioDescription?: string;
      productContext?: string;
      modelId?: string;
      behavior?: {
        userLed?: boolean;
        allowProactive?: boolean;
        maxQuestions?: number;
        responseStyle?: "acknowledge_then_wait" | "guide_lightly" | "advisor";
        phase?: string;
      };
    },
  ): Promise<{ reply: Message; session: Session }> {
    return request<{ reply: Message; session: Session }>(`/sessions/${sessionId}/messages`, {
      method: "POST",
      body: { role, content, tags, missionStatus, agentContext },
    });
  },
  async evaluate(
    sessionId: string,
    payload?: {
      criteria: RatingCriterion[];
      passingScore?: number;
      scenarioTitle?: string;
      scenarioDescription?: string;
      productContext?: string;
      scenarioPrompt?: string;
      scenarioType?: string;
      testCasesContext?: string;
    },
  ): Promise<Evaluation> {
    return request<Evaluation>(`/sessions/${sessionId}/evaluate`, {
      method: "POST",
      body: payload,
    });
  },
  async listComments(sessionId: string): Promise<ManagerComment[]> {
    return request<ManagerComment[]>(`/sessions/${sessionId}/comments`);
  },
  async createComment(
    sessionId: string,
    payload: { content: string; authorName?: string },
  ): Promise<ManagerComment> {
    return request<ManagerComment>(`/sessions/${sessionId}/comments`, {
      method: "POST",
      body: payload,
    });
  },
  async listTestCases(sessionId: string): Promise<TestCase[]> {
    return request<TestCase[]>(`/sessions/${sessionId}/test-cases`);
  },
  async createTestCase(
    sessionId: string,
    payload: {
      name: string;
      preconditions: string;
      steps: string;
      expectedResult: string;
    },
  ): Promise<TestCase> {
    return request<TestCase>(`/sessions/${sessionId}/test-cases`, {
      method: "POST",
      body: payload,
    });
  },
  async deleteTestCase(id: string): Promise<void> {
    await request(`/test-cases/${id}`, { method: "DELETE" });
  },
};
