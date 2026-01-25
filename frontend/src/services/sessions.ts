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
  Mission,
  MissionStatus,
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

const requestEvaluation = async (params: {
  sessionId: string;
  scenarioId: string;
  messages: Message[];
}): Promise<Evaluation> => {
  const res = await fetch("/api/evaluate-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errorData.error ?? "評価の生成に失敗しました");
  }

  return (await res.json()) as Evaluation;
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

const requestMissionCompletion = async (params: {
  scenarioId: string;
  missions: Mission[];
  messages: Message[];
  existingMissionStatus?: MissionStatus[];
}): Promise<string[] | null> => {
  try {
    const res = await fetch("/api/mission-detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { completedMissionIds?: string[] };
    if (!Array.isArray(data.completedMissionIds)) return null;
    return data.completedMissionIds.filter((id): id is string => typeof id === "string");
  } catch (error) {
    console.error("Mission detection failed", error);
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
  await storage.saveSession(snapshot);
  return { ...snapshot, history: [], loading: false, offline: isOffline() };
}

export async function resumeSession(scenarioId?: string): Promise<SessionState | null> {
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
    await storage.saveSession(snapshot);
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

  if (reply && !isOffline()) {
    const scenarioMissions = scenario?.missions ?? [];
    const existingIds = new Set((session.missionStatus ?? []).map((m) => m.missionId));
    const allDone =
      scenarioMissions.length > 0 && scenarioMissions.every((mission) => existingIds.has(mission.id));
    if (scenarioMissions.length > 0 && !allDone) {
      const completedMissionIds =
        (await requestMissionCompletion({
          scenarioId: session.scenarioId,
          missions: scenarioMissions,
          messages,
          existingMissionStatus: session.missionStatus,
        })) ?? [];
      if (completedMissionIds.length > 0) {
        const nextMissionStatus = [...(session.missionStatus ?? [])];
        completedMissionIds.forEach((missionId) => {
          if (!existingIds.has(missionId)) {
            nextMissionStatus.push({ missionId, completedAt: new Date().toISOString() });
            existingIds.add(missionId);
          }
        });
        session.missionStatus = nextMissionStatus;
      }
    }
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
  if (env.apiBase) {
    evaluation = await api.evaluate(state.session.id);
  } else {
    // Use AI-powered evaluation via the evaluate-session API
    evaluation = await requestEvaluation({
      sessionId: state.session.id,
      scenarioId: state.session.scenarioId,
      messages: state.messages,
    });
  }

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
  if (env.apiBase) {
    return api.listSessions();
  }
  // Local: derive from stored sessions
  if (typeof window === "undefined") return [];
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(env.storageKeyPrefix + ":session:"));
  const items = await Promise.all(
    keys.map(async (k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      let snapshot: SessionSnapshot;
      try {
        snapshot = JSON.parse(raw) as SessionSnapshot;
      } catch (error) {
        console.warn("Skipping invalid session snapshot", { key: k, error });
        return null;
      }
      if (!snapshot?.session?.id) return null;
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
        comments: await storage.loadComments(snapshot.session.id),
      } as HistoryItem;
    })
  );
  return items.filter(Boolean) as HistoryItem[];
}
