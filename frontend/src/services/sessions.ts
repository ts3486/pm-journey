import { env } from "@/config/env";
import { api } from "@/services/api";
import { getScenarioById } from "@/config/scenarios";
import { storage, type SessionSnapshot } from "@/services/storage";
import type {
  Evaluation,
  HistoryItem,
  Message,
  MessageRole,
  MessageTag,
  ProgressFlags,
  Session,
  ScenarioDiscipline,
} from "@/types/session";

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const defaultProgressFlags = (): ProgressFlags => ({
  requirements: false,
  priorities: false,
  risks: false,
  acceptance: false,
});

const defaultSession = (scenarioId: string, scenarioDiscipline?: ScenarioDiscipline): Session => ({
  id: randomId("session"),
  scenarioId,
  scenarioDiscipline,
  status: "active",
  startedAt: new Date().toISOString(),
  endedAt: undefined,
  lastActivityAt: new Date().toISOString(),
  userName: undefined,
  progressFlags: defaultProgressFlags(),
  evaluationRequested: false,
  missionStatus: [],
});

const createAgentReply = (userMessage: string): Message => ({
  id: randomId("msg"),
  sessionId: "",
  role: "agent",
  content: `ありがとうございます。`,
  createdAt: new Date().toISOString(),
  tags: ["summary"],
});

const kickoffMessage = (sessionId: string, prompt?: string): Message[] => {
  if (!prompt) return [];
  return [
    {
      id: randomId("msg"),
      sessionId,
      role: "system",
      content: prompt,
      createdAt: new Date().toISOString(),
      tags: ["summary"],
    },
  ];
};

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
  offline: boolean;
};

const isOffline = (): boolean => {
  if (!env.offlineQueue) return false;
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine;
};

const requestAgentReply = async (params: {
  scenarioId: string;
  prompt?: string;
  messages: Message[];
}): Promise<string | null> => {
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: string };
    return data.reply ?? null;
  } catch (error) {
    console.error("Agent request failed", error);
    return null;
  }
};

export async function startSession(
  scenarioId: string,
  scenarioDiscipline?: ScenarioDiscipline,
  kickoffPrompt?: string,
): Promise<SessionState> {
  let session: Session;
  if (env.apiBase) {
    session = await api.createSession(scenarioId);
  } else {
    session = defaultSession(scenarioId, scenarioDiscipline);
  }
  session = {
    ...session,
    scenarioDiscipline: session.scenarioDiscipline ?? scenarioDiscipline,
  };
  const messages = kickoffMessage(session.id, kickoffPrompt);
  const snapshot: SessionSnapshot = { session, messages, evaluation: undefined };
  storage.saveSession(snapshot);
  return { ...snapshot, history: [], loading: false, offline: isOffline() };
}

export function resumeSession(scenarioId?: string): SessionState | null {
  const lastId = storage.loadLastSessionId(scenarioId);
  if (!lastId) return null;
  const snapshot = storage.loadSession(lastId);
  if (!snapshot) return null;
  return { ...snapshot, history: [], loading: false, offline: isOffline() };
}

export function resetSession(sessionId: string | undefined, scenarioId: string | undefined): void {
  if (!sessionId || !scenarioId) return;
  storage.clearLastSessionPointer(scenarioId, sessionId);
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
    queuedOffline: isOffline() ? true : undefined,
  };

  const messages = [...state.messages, message];
  let reply: Message | null = null;
  const scenario = getScenarioById(session.scenarioId);

  if (isOffline()) {
    const snapshot: SessionSnapshot = { session, messages, evaluation: state.evaluation };
    storage.saveSession(snapshot);
    return { ...state, session, messages, offline: true };
  }

  if (env.apiBase) {
    const apiMessage = await api.postMessage(session.id, role, content, tags, session.missionStatus);
    reply = apiMessage.reply;
    session.missionStatus = apiMessage.session.missionStatus;
  } else if (role === "user") {
    const agentText =
      (await requestAgentReply({
        scenarioId: session.scenarioId,
        prompt: scenario?.kickoffPrompt,
        messages,
      })) ?? "ありがとうございます。詳細を教えてください。";
    reply = {
      id: randomId("msg"),
      sessionId: session.id,
      role: "agent",
      content: agentText,
      createdAt: new Date().toISOString(),
      tags: ["summary"],
    };
  }

  if (reply) {
    messages.push(reply);
  }

  const snapshot: SessionSnapshot = { session, messages, evaluation: state.evaluation };
  storage.saveSession(snapshot);
  return { ...state, session, messages, offline: isOffline() };
}

export async function evaluate(state: SessionState): Promise<SessionState> {
  if (isOffline()) {
    throw new Error("Offline: evaluation is disabled until connectivity returns.");
  }
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
  return { ...state, session, evaluation, offline: isOffline() };
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
  return { ...state, session, offline: isOffline() };
}

export function updateMissionStatus(
  state: SessionState,
  missionId: string,
  completed: boolean,
): SessionState {
  const missionStatus = [...(state.session.missionStatus ?? [])];
  const existingIndex = missionStatus.findIndex((m) => m.missionId === missionId);
  if (completed) {
    const entry = { missionId, completedAt: new Date().toISOString() };
    if (existingIndex >= 0) missionStatus[existingIndex] = entry;
    else missionStatus.push(entry);
  } else if (existingIndex >= 0) {
    missionStatus.splice(existingIndex, 1);
  }

  const session: Session = {
    ...state.session,
    missionStatus,
    lastActivityAt: new Date().toISOString(),
  };
  const snapshot: SessionSnapshot = { session, messages: state.messages, evaluation: state.evaluation };
  storage.saveSession(snapshot);
  return { ...state, session, offline: isOffline() };
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
        scenarioId: snapshot.session.scenarioId,
        scenarioDiscipline: snapshot.session.scenarioDiscipline,
        metadata: {
          duration: undefined,
          messageCount: snapshot.messages.length,
        },
        actions: snapshot.messages.filter((m) => m.tags && m.tags.length > 0),
        evaluation: snapshot.evaluation,
        storageLocation: "local",
        comments: storage.loadComments(snapshot.session.id),
      } as HistoryItem;
    })
    .filter(Boolean) as HistoryItem[];
}
