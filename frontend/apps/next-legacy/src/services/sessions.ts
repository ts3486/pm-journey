import { resolveAgentProfile } from "@pm-journey/config";
import { api } from "@/services/api";
import { getScenarioById } from "@pm-journey/config";
import { storage } from "@/services/storage";
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
} from "@pm-journey/types";

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

export type SessionSnapshot = {
  session: Session;
  messages: Message[];
  evaluation?: Evaluation;
};

export type SessionState = SessionSnapshot & {
  history: HistoryItem[];
  loading: boolean;
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
  let session: Session;
  session = await api.createSession(scenarioId);
  session = {
    ...session,
    scenarioDiscipline: session.scenarioDiscipline ?? scenarioDiscipline,
  };
  const messages = kickoffMessage(session.id, kickoffPrompt);

  // Set the session pointer in localStorage
  storage.setLastSession(session.id, scenarioId);

  return { session, messages, evaluation: undefined, history: [], loading: false };
}

export async function resumeSession(scenarioId?: string): Promise<SessionState | null> {
  const lastId = await storage.loadLastSessionId(scenarioId);
  if (!lastId) return null;

  try {
    // Fetch session data from API
    const historyItem = await api.getSession(lastId);
    // Fetch all messages from API
    const messages = await api.listMessages(lastId);

    const session: Session = {
      id: historyItem.sessionId,
      scenarioId: historyItem.scenarioId ?? "",
      scenarioDiscipline: historyItem.scenarioDiscipline,
      status: historyItem.evaluation ? "evaluated" : "active",
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      progressFlags: {
        requirements: false,
        priorities: false,
        risks: false,
        acceptance: false,
      },
      evaluationRequested: !!historyItem.evaluation,
      missionStatus: [],
    };

    return {
      session,
      messages,
      evaluation: historyItem.evaluation,
      history: [],
      loading: false,
    };
  } catch {
    // Session not found in API, clear the pointer
    if (scenarioId) {
      await storage.clearLastSessionPointer(scenarioId, lastId);
    }
    return null;
  }
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
  const session = { ...state.session, lastActivityAt: new Date().toISOString() };
  const message = options?.existingMessage ?? createLocalMessage(session.id, role, content, tags);
  const hasMessage = state.messages.some((m) => m.id === message.id);
  const messages = hasMessage ? [...state.messages] : [...state.messages, message];
  let reply: Message | null = null;
  const scenario = getScenarioById(session.scenarioId);

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

  // Update session pointer
  storage.setLastSession(session.id, session.scenarioId);

  return { ...state, session, messages };
}

export async function evaluate(state: SessionState): Promise<SessionState> {
  const scenario = getScenarioById(state.session.scenarioId);
  const payload = scenario
    ? {
        criteria: scenario.evaluationCriteria,
        passingScore: scenario.passingScore,
        scenarioType: scenario.scenarioType,
        scenarioTitle: scenario.title,
        scenarioDescription: scenario.description,
        productContext: formatProductContext(scenario.product),
        scenarioPrompt: scenario.kickoffPrompt,
      }
    : undefined;
  const evaluation = await api.evaluate(state.session.id, payload);

  const session: Session = {
    ...state.session,
    status: "evaluated",
    evaluationRequested: true,
    lastActivityAt: new Date().toISOString(),
  };

  // Clear session pointer since it's now evaluated
  await storage.clearLastSessionPointer(session.scenarioId, session.id);

  return { ...state, session, evaluation };
}

export async function evaluateSessionById(
  sessionId: string,
  scenarioId?: string,
  testCasesContext?: string,
): Promise<Evaluation> {
  const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;
  const payload = scenario
    ? {
        criteria: scenario.evaluationCriteria,
        passingScore: scenario.passingScore,
        scenarioTitle: scenario.title,
        scenarioDescription: scenario.description,
        productContext: formatProductContext(scenario.product),
        scenarioPrompt: scenario.kickoffPrompt,
        scenarioType: scenario.scenarioType,
        testCasesContext,
      }
    : undefined;
  const evaluation = await api.evaluate(sessionId, payload);
  if (scenarioId) {
    await storage.clearLastSessionPointer(scenarioId, sessionId);
  }
  return evaluation;
}

export async function updateProgress(
  state: SessionState,
  progressFlags: Partial<ProgressFlags>,
): Promise<SessionState> {
  const session: Session = {
    ...state.session,
    progressFlags: { ...state.session.progressFlags, ...progressFlags },
  };
  // Progress flags are local state only; they're included in mission status when messages are sent
  return { ...state, session };
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
  // Mission status is sent with next message; no need to save locally
  return { ...state, session };
}

export async function loadHistory(): Promise<HistoryItem[]> {
  return api.listSessions();
}
