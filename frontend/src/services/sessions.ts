import { env } from "@/config/env";
import { resolveAgentProfile } from "@/config/agentProfiles";
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
  Scenario,
  Session,
  ScenarioDiscipline,
} from "@/types/session";

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const createLocalMessage = (
  sessionId: string,
  role: MessageRole,
  content: string,
  tags?: MessageTag[],
): Message => ({
  id: randomId("msg"),
  sessionId,
  role,
  content,
  createdAt: new Date().toISOString(),
  tags,
  queuedOffline: isOffline() ? true : undefined,
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

const requireApiBase = () => {
  if (!env.apiBase) {
    throw new Error("API base is not configured. Set NEXT_PUBLIC_API_BASE to use the backend API.");
  }
};

const formatProductContext = (product: Scenario["product"]) => {
  const list = (label: string, items?: string[]) =>
    items && items.length > 0 ? `- ${label}: ${items.join("、")}` : "";

  const lines = [
    "## プロダクト情報",
    `- 名前: ${product.name}`,
    `- 概要: ${product.summary}`,
    `- 対象: ${product.audience}`,
    list("課題", product.problems),
    list("目標", product.goals),
    list("差別化要素", product.differentiators),
    list("スコープ", product.scope),
    list("制約", product.constraints),
    `- タイムライン: ${product.timeline}`,
    list("成功条件", product.successCriteria),
    product.uniqueEdge ? `- 学習の焦点: ${product.uniqueEdge}` : "",
    list("技術スタック", product.techStack),
    list("主要機能", product.coreFeatures),
  ];

  return lines.filter((line) => line.length > 0).join("\n");
};


export async function startSession(
  scenarioId: string,
  scenarioDiscipline?: ScenarioDiscipline,
  kickoffPrompt?: string,
): Promise<SessionState> {
  requireApiBase();
  let session: Session;
  session = await api.createSession(scenarioId);
  session = {
    ...session,
    scenarioDiscipline: session.scenarioDiscipline ?? scenarioDiscipline,
  };
  const messages = kickoffMessage(session.id, kickoffPrompt);
  const snapshot: SessionSnapshot = { session, messages, evaluation: undefined };
  await storage.saveSession(snapshot);
  return { ...snapshot, history: [], loading: false, offline: isOffline() };
}

export async function resumeSession(scenarioId?: string): Promise<SessionState | null> {
  requireApiBase();
  const lastId = await storage.loadLastSessionId(scenarioId);
  if (!lastId) return null;
  const snapshot = await storage.loadSession(lastId);
  if (!snapshot) return null;
  return { ...snapshot, history: [], loading: false, offline: isOffline() };
}

export async function resetSession(sessionId: string | undefined, scenarioId: string | undefined): Promise<void> {
  if (!sessionId || !scenarioId) return;
  await storage.clearLastSessionPointer(scenarioId, sessionId);
}

export async function sendMessage(
  state: SessionState,
  role: MessageRole,
  content: string,
  tags?: MessageTag[],
  options?: { existingMessage?: Message },
): Promise<SessionState> {
  requireApiBase();
  const session = { ...state.session, lastActivityAt: new Date().toISOString() };
  const message = options?.existingMessage ?? createLocalMessage(session.id, role, content, tags);
  const hasMessage = state.messages.some((m) => m.id === message.id);
  const messages = hasMessage ? [...state.messages] : [...state.messages, message];
  let reply: Message | null = null;
  const scenario = getScenarioById(session.scenarioId);

  if (isOffline()) {
    const snapshot: SessionSnapshot = { session, messages, evaluation: state.evaluation };
    await storage.saveSession(snapshot);
    return { ...state, session, messages, offline: true };
  }

  const profile = resolveAgentProfile(session.scenarioId);
  const agentContext =
    role === "user" && scenario
      ? {
          systemPrompt: profile.systemPrompt,
          modelId: profile.modelId,
          scenarioPrompt: scenario.kickoffPrompt,
          scenarioTitle: scenario.title,
          scenarioDescription: scenario.description,
          productContext: formatProductContext(scenario.product),
          behavior: scenario.behavior,
        }
      : undefined;
  const apiMessage = await api.postMessage(
    session.id,
    role,
    content,
    tags,
    session.missionStatus,
    agentContext,
  );
  reply = apiMessage.reply;
  session.missionStatus = apiMessage.session.missionStatus;

  if (reply) {
    messages.push(reply);
  }

  if (reply && !isOffline()) {
    // Mission status updates are handled manually when using the backend API.
  }

  const snapshot: SessionSnapshot = { session, messages, evaluation: state.evaluation };
  await storage.saveSession(snapshot);
  return { ...state, session, messages, offline: isOffline() };
}

export async function evaluate(state: SessionState): Promise<SessionState> {
  if (isOffline()) {
    throw new Error("Offline: evaluation is disabled until connectivity returns.");
  }

  let evaluation: Evaluation;
  requireApiBase();
  evaluation = await api.evaluate(state.session.id);

  const session: Session = {
    ...state.session,
    status: "evaluated",
    evaluationRequested: true,
    lastActivityAt: new Date().toISOString(),
  };
  const snapshot: SessionSnapshot = { session, messages: state.messages, evaluation };
  await storage.saveSession(snapshot);
  return { ...state, session, evaluation, offline: isOffline() };
}

export async function updateProgress(
  state: SessionState,
  progressFlags: Partial<ProgressFlags>,
): Promise<SessionState> {
  const session: Session = {
    ...state.session,
    progressFlags: { ...state.session.progressFlags, ...progressFlags },
  };
  const snapshot: SessionSnapshot = { session, messages: state.messages, evaluation: state.evaluation };
  await storage.saveSession(snapshot);
  return { ...state, session, offline: isOffline() };
}

export async function updateMissionStatus(
  state: SessionState,
  missionId: string,
  completed: boolean,
): Promise<SessionState> {
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
  await storage.saveSession(snapshot);
  return { ...state, session, offline: isOffline() };
}

export async function loadHistory(): Promise<HistoryItem[]> {
  requireApiBase();
  return api.listSessions();
}
