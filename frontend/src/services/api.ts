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
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  async createSession(scenarioId: string): Promise<Session> {
    return request<Session>("/sessions", { method: "POST", body: { scenarioId } });
  },
  async listSessions(): Promise<HistoryItem[]> {
    return request<HistoryItem[]>("/sessions");
  },
  async getSession(id: string): Promise<HistoryItem> {
    return request<HistoryItem>(`/sessions/${id}`);
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
  async evaluate(sessionId: string): Promise<Evaluation> {
    return request<Evaluation>(`/sessions/${sessionId}/evaluate`, { method: "POST" });
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
};
