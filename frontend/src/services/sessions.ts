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

const createEvaluation = (sessionId: string, scenarioId: string): Evaluation => {
  const scenario = getScenarioById(scenarioId);
  const criteria = scenario?.evaluationCriteria ?? [
    { name: "方針提示とリード力", weight: 25 },
    { name: "計画と実行可能性", weight: 25 },
    { name: "コラボレーションとフィードバック", weight: 25 },
    { name: "リスク/前提管理と改善姿勢", weight: 25 },
  ];
  const baseScore = 75;
  const categories = criteria.map((c, idx) => {
    const delta = (idx % 2 === 0 ? 5 : -2) + Math.floor(Math.random() * 6 - 3);
    const score = Math.max(60, Math.min(95, baseScore + delta));
    const feedback =
      scenario?.supplementalInfo && idx === 0
        ? `補足情報（${scenario.supplementalInfo.slice(0, 40)}…）を踏まえた方針提示は良好です。論点を3点に絞り、根拠と次アクションをセットで提示すると更に伝わります。`
        : `${c.name} に関して、具体例・測定指標・関係者の反応を添えてください。合意形成の過程とリスクフォローも1文で触れると説得力が上がります。`;
    return { name: c.name, weight: c.weight, score, feedback };
  });

  return {
    sessionId,
    overallScore: Math.round(categories.reduce((sum, c) => sum + (c.score ?? baseScore) * (c.weight / 100), 0)),
    passing: true,
    categories,
    summary:
      "シナリオの目標に沿って論点が整理され、会話のリードも安定しています。意思決定の根拠とステークホルダーへの伝え方を、事実・解釈・提案の3階層で示すと再現性が高まります。",
    improvementAdvice:
      "① 成果指標・期日・担当をセットで明文化する ② リスクと前提を担当/期日付きで棚卸しし、対策を1行で記載する ③ 主要ステークホルダー向けの要約（課題→提案→インパクト）を3行で用意する ④ 次の打ち手を時系列で箇条書きにし、依存と準備物を明記してください。",
  };
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
    evaluation = createEvaluation(state.session.id, state.session.scenarioId);
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
