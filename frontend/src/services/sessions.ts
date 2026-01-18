import { env } from "@/config/env";
import { api } from "@/services/api";
import { storage, type SessionSnapshot } from "@/services/storage";
import type {
  Evaluation,
  HistoryItem,
  Message,
  MessageRole,
  MessageTag,
  ProgressFlags,
  Session,
} from "@/types/session";

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const defaultProgressFlags = (): ProgressFlags => ({
  requirements: false,
  priorities: false,
  risks: false,
  acceptance: false,
});

const defaultSession = (scenarioId: string): Session => ({
  id: randomId("session"),
  scenarioId,
  status: "active",
  startedAt: new Date().toISOString(),
  endedAt: undefined,
  lastActivityAt: new Date().toISOString(),
  userName: undefined,
  progressFlags: defaultProgressFlags(),
  evaluationRequested: false,
});

const createAgentReply = (userMessage: string): Message => ({
  id: randomId("msg"),
  sessionId: "",
  role: "agent",
  content: `ありがとうございます。現状の入力: ${userMessage}`,
  createdAt: new Date().toISOString(),
  tags: ["summary"],
});

const createEvaluation = (sessionId: string): Evaluation => ({
  sessionId,
  overallScore: 75,
  passing: true,
  categories: [
    { name: "方針提示とリード力", weight: 25, score: 75, feedback: "明確な方針を提示できました。" },
    { name: "計画と実行可能性", weight: 25, score: 70, feedback: "計画に優先順位を追加しましょう。" },
    { name: "コラボレーションとフィードバック", weight: 25, score: 78, feedback: "対話の往復が十分です。" },
    { name: "リスク/前提管理と改善姿勢", weight: 25, score: 76, feedback: "リスク洗い出しを補強してください。" },
  ],
  summary: "要件整理が進み、評価基準を満たしました。",
  improvementAdvice: "優先度付けとリスク対策の明確化を追加で行ってください。",
});

export type SessionState = SessionSnapshot & {
  history: HistoryItem[];
  loading: boolean;
};

export async function startSession(scenarioId: string): Promise<SessionState> {
  let session: Session;
  if (env.apiBase) {
    session = await api.createSession(scenarioId);
  } else {
    session = defaultSession(scenarioId);
  }
  const snapshot: SessionSnapshot = { session, messages: [], evaluation: undefined };
  storage.saveSession(snapshot);
  return { ...snapshot, history: [], loading: false };
}

export function resumeSession(): SessionState | null {
  const lastId = storage.loadLastSessionId();
  if (!lastId) return null;
  const snapshot = storage.loadSession(lastId);
  if (!snapshot) return null;
  return { ...snapshot, history: [], loading: false };
}

export function resetSession(sessionId: string | undefined): void {
  if (!sessionId) return;
  storage.clearSession(sessionId);
}

export async function sendMessage(
  state: SessionState,
  role: MessageRole,
  content: string,
  tags?: MessageTag[],
): Promise<SessionState> {
  const session = { ...state.session, lastActivityAt: new Date().toISOString() };
  const message: Message = {
    id: randomId("msg"),
    sessionId: session.id,
    role,
    content,
    createdAt: new Date().toISOString(),
    tags,
  };

  const messages = [...state.messages, message];
  let reply: Message | null = null;

  if (env.apiBase) {
    const apiMessage = await api.postMessage(session.id, role, content, tags);
    reply = apiMessage;
  } else if (role === "user") {
    reply = createAgentReply(content);
    reply.sessionId = session.id;
  }

  if (reply) {
    messages.push(reply);
  }

  const snapshot: SessionSnapshot = { session, messages, evaluation: state.evaluation };
  storage.saveSession(snapshot);
  return { ...state, session, messages };
}

export async function evaluate(state: SessionState): Promise<SessionState> {
  let evaluation: Evaluation;
  if (env.apiBase) {
    evaluation = await api.evaluate(state.session.id);
  } else {
    evaluation = createEvaluation(state.session.id);
  }
  const session: Session = {
    ...state.session,
    status: "evaluated",
    evaluationRequested: true,
    lastActivityAt: new Date().toISOString(),
  };
  const snapshot: SessionSnapshot = { session, messages: state.messages, evaluation };
  storage.saveSession(snapshot);
  return { ...state, session, evaluation };
}

export function updateProgress(
  state: SessionState,
  progressFlags: Partial<ProgressFlags>,
): SessionState {
  const session: Session = {
    ...state.session,
    progressFlags: { ...state.session.progressFlags, ...progressFlags },
  };
  const snapshot: SessionSnapshot = { session, messages: state.messages, evaluation: state.evaluation };
  storage.saveSession(snapshot);
  return { ...state, session };
}

export async function loadHistory(): Promise<HistoryItem[]> {
  if (env.apiBase) {
    return api.listSessions();
  }
  // Local: derive from stored sessions
  if (typeof window === "undefined") return [];
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(env.storageKeyPrefix + ":session:"));
  return keys
    .map((k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const snapshot = JSON.parse(raw) as SessionSnapshot;
      return {
        sessionId: snapshot.session.id,
        metadata: {
          duration: undefined,
          messageCount: snapshot.messages.length,
        },
        actions: snapshot.messages.filter((m) => m.tags && m.tags.length > 0),
        evaluation: snapshot.evaluation,
        storageLocation: "local",
      } as HistoryItem;
    })
    .filter(Boolean) as HistoryItem[];
}
