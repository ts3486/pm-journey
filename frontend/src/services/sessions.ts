import { getScenarioById, resolveAgentProfile } from "@/config";
import type { AgentProfile } from "@/config";
import { buildScenarioEvaluationCriteria } from "@/lib/scenarioEvaluationCriteria";
import { api } from "@/services/api";
import { storage } from "@/services/storage";
import type {
  AssistanceMode,
  Evaluation,
  HistoryItem,
  Message,
  MessageRole,
  MessageTag,
  ProductConfig,
  ProgressFlags,
  Scenario,
  Session,
} from "@/types";

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

const seededMessagesForBasicScenario = async (sessionId: string, scenario: Scenario): Promise<Message[]> => {
  const messages: Message[] = [];
  const agentResponseEnabled = scenario.behavior?.agentResponseEnabled ?? true;
  const agentOpening = agentResponseEnabled ? scenario.agentOpeningMessage?.trim() : undefined;

  if (agentOpening) {
    const posted = await api.postMessage(sessionId, "agent", agentOpening, ["summary"]);
    messages.push(posted.reply);
  }

  return messages;
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

let cachedProductConfig: ProductConfig | null | undefined;
let productConfigFetchPromise: Promise<ProductConfig | undefined> | null = null;

async function getProductConfigSnapshot(): Promise<ProductConfig | undefined> {
  if (cachedProductConfig !== undefined) {
    return cachedProductConfig ?? undefined;
  }
  if (productConfigFetchPromise) {
    return productConfigFetchPromise;
  }
  productConfigFetchPromise = (async () => {
    try {
      const config = await api.getProductConfig();
      cachedProductConfig = config;
      return config;
    } catch {
      cachedProductConfig = null;
      return undefined;
    } finally {
      productConfigFetchPromise = null;
    }
  })();
  return productConfigFetchPromise;
}

export function invalidateProductPromptCache() {
  cachedProductConfig = undefined;
}

const renderPromptTemplate = (
  template: string,
  scenario: Scenario,
  productConfig?: ProductConfig,
) => {
  const variables: Record<string, string | undefined> = {
    scenarioTitle: scenario.title,
    scenarioDescription: scenario.description,
    scenarioDiscipline: scenario.discipline,
    scenarioType: scenario.scenarioType ?? "",
    productName: productConfig?.name,
    productSummary: productConfig?.summary,
    productAudience: productConfig?.audience,
    productTimeline: productConfig?.timeline,
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => variables[key] ?? "");
};

const buildScenarioContext = (scenario: Scenario) => {
  const agentResponseEnabled = scenario.behavior?.agentResponseEnabled ?? true;
  const lines = [
    scenario.kickoffPrompt ? `- システム案内: ${scenario.kickoffPrompt}` : "",
    scenario.agentOpeningMessage && agentResponseEnabled
      ? `- 会話相手の初回発話: ${scenario.agentOpeningMessage}`
      : "",
    scenario.supplementalInfo ? `- 補足情報: ${scenario.supplementalInfo}` : "",
  ].filter((line) => line.length > 0);
  if (scenario.missions?.length) {
    const missionLines = [...scenario.missions]
      .sort((a, b) => a.order - b.order)
      .map((mission, index) => `${index + 1}. ${mission.title}${mission.description ? ` (${mission.description})` : ""}`);
    lines.push(`- ミッション:\n${missionLines.join("\n")}`);
  }
  return lines.length > 0 ? `## シナリオ詳細\n${lines.join("\n")}` : "";
};

const resolveScenarioType = (scenario: Scenario): string => {
  if (scenario.scenarioType) return scenario.scenarioType;
  if (scenario.discipline === "CHALLENGE") return "challenge";
  return "basic";
};

const formatProductContext = (scenario: Scenario, productConfig?: ProductConfig) => {
  const productPrompt = productConfig?.productPrompt?.trim();
  const list = (label: string, items?: string[]) =>
    items && items.length > 0 ? `- ${label}: ${items.join("、")}` : "";

  const productLines = [
    productConfig?.name ? `- 名前: ${productConfig.name}` : "",
    productConfig?.summary ? `- 概要: ${productConfig.summary}` : "",
    productConfig?.audience ? `- 対象: ${productConfig.audience}` : "",
    list("課題", productConfig?.problems),
    list("目標", productConfig?.goals),
    list("差別化要素", productConfig?.differentiators),
    list("スコープ", productConfig?.scope),
    list("制約", productConfig?.constraints),
    productConfig?.timeline ? `- タイムライン: ${productConfig.timeline}` : "",
    list("成功条件", productConfig?.successCriteria),
    productConfig?.uniqueEdge ? `- 学習の焦点: ${productConfig.uniqueEdge}` : "",
    list("技術スタック", productConfig?.techStack),
    list("主要機能", productConfig?.coreFeatures),
  ].filter((line) => line.length > 0);

  const sections = [
    ...(productPrompt
      ? ["## プロジェクトメモ", renderPromptTemplate(productPrompt, scenario, productConfig)]
      : []),
    ...(productLines.length > 0 ? ["## プロダクト情報", ...productLines] : []),
  ];

  return sections.join("\n");
};

export function buildAssistanceModeRules(mode: AssistanceMode): string {
  const rules: Record<AssistanceMode, string> = {
    "hands-off": `## 支援モード: 見守り
- ユーザーの質問には答えない
- タスク完了後に評価のみ行う
- ユーザーが提出した内容に対しても、判断の根拠や前提を問い直す
- ミッションの完全な答えは絶対に提示しない`,
    "on-request": `## 支援モード: 質問対応
- ユーザーから質問があった場合のみ応答する
- こちらから積極的にアドバイスしない
- ヒントは求められたときだけ提供する
- ユーザーの判断に疑問を投げかけ、考えを深めさせる
- ミッションの完全な答えは絶対に提示しない`,
    "guided": `## 支援モード: ガイド付き
- ユーザーの進捗を確認し、次のステップを提案してよい
- 質問は1つずつ
- 考え方のフレームワークを示してよいが、答えは教えない
- ユーザーの判断に疑問を投げかけ、考えを深めさせる
- ミッションの完全な答えは絶対に提示しない`,
    "review": `## 支援モード: レビュー
- ユーザーが成果物を提出するまで待つ
- 提出されたら、弱い論拠や抜け漏れを指摘する
- 良い点にも触れるが、改善すべき点を重点的にフィードバックする
- ユーザーの判断に疑問を投げかけ、考えを深めさせる
- ミッションの完全な答えは絶対に提示しない`,
  };
  return rules[mode];
}

export function buildSupportPrompt({
  scenario,
  productConfig,
  profile,
}: {
  scenario: Scenario;
  productConfig?: ProductConfig;
  profile: AgentProfile;
}) {
  const task = scenario.task!;

  const taskSection = [
    `## タスク指示`,
    task.instruction,
    ...(task.template?.sections
      ? [`\n期待される構成:`, ...task.template.sections.map((s) => `- ${s}`)]
      : []),
    ...(task.template?.example
      ? [`\n## 成果物の例\n${task.template.example}`]
      : []),
  ].join("\n");

  const modeRules = buildAssistanceModeRules(
    scenario.assistanceMode ?? scenario.behavior?.assistanceMode ?? "on-request",
  );

  const referenceSection = task.referenceInfo
    ? `## 背景情報\n${task.referenceInfo}`
    : "";

  const productContext = formatProductContext(scenario, productConfig);

  const scenarioPrompt = [taskSection, referenceSection, modeRules]
    .filter(Boolean)
    .join("\n\n");

  return {
    systemPrompt: profile.systemPrompt,
    tonePrompt: profile.tonePrompt,
    modelId: profile.modelId,
    scenarioPrompt,
    scenarioTitle: scenario.title,
    scenarioDescription: scenario.description,
    productContext,
    behavior: scenario.behavior,
    task: {
      instruction: task.instruction,
      deliverableFormat: task.deliverableFormat,
      template: task.template,
      referenceInfo: task.referenceInfo,
      hints: task.hints,
    },
  };
}

export async function startSession(scenario: Scenario): Promise<SessionState> {
  let session = await api.createSession(scenario.id);
  session = {
    ...session,
    scenarioDiscipline: session.scenarioDiscipline ?? scenario.discipline,
  };
  const messages = scenario.scenarioType === "basic" ? await seededMessagesForBasicScenario(session.id, scenario) : [];
  storage.setLastSession(session.id, scenario.id);
  return { session, messages, evaluation: undefined, history: [], loading: false };
}

export async function resumeSession(scenarioId?: string): Promise<SessionState | null> {
  const lastId = await storage.loadLastSessionId(scenarioId);
  if (!lastId) return null;

  try {
    const historyItem = await api.getSession(lastId);
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
  const scenario = getScenarioById(session.scenarioId);
  const profile = resolveAgentProfile(session.scenarioId);
  const productConfig = scenario ? await getProductConfigSnapshot() : undefined;

  const agentContext =
    role === "user" && scenario
      ? scenario.task
        ? buildSupportPrompt({ scenario, productConfig, profile })
        : {
            systemPrompt: profile.systemPrompt,
            tonePrompt: profile.tonePrompt,
            modelId: profile.modelId,
            scenarioPrompt: buildScenarioContext(scenario) || scenario.kickoffPrompt,
            scenarioTitle: scenario.title,
            scenarioDescription: scenario.description,
            productContext: formatProductContext(scenario, productConfig),
            behavior: scenario.behavior,
            customPrompt: scenario.customPrompt,
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
  const reply = apiMessage.reply;
  session.missionStatus = apiMessage.session.missionStatus;
  const nextMessages =
    scenario?.scenarioType === "basic"
      ? await api.listMessages(session.id)
      : (() => {
          if (reply && reply.role !== "user") messages.push(reply);
          return messages;
        })();

  storage.setLastSession(session.id, session.scenarioId);
  return { ...state, session, messages: nextMessages };
}

export async function evaluate(state: SessionState): Promise<SessionState> {
  const scenario = getScenarioById(state.session.scenarioId);
  const productConfig = scenario ? await getProductConfigSnapshot() : undefined;
  const criteria = scenario
    ? buildScenarioEvaluationCriteria({
        scenario,
        scenarioEvaluationCriteria: productConfig?.scenarioEvaluationCriteria,
        fallbackCriteria: scenario.evaluationCriteria,
      })
    : undefined;
  const payload = scenario
    ? {
        criteria: criteria ?? scenario.evaluationCriteria,
        passingScore: scenario.passingScore,
        scenarioType: resolveScenarioType(scenario),
        scenarioTitle: scenario.title,
        scenarioDescription: scenario.description,
        productContext: formatProductContext(scenario, productConfig),
        scenarioPrompt: buildScenarioContext(scenario) || scenario.kickoffPrompt,
      }
    : undefined;
  const evaluation = await api.evaluate(state.session.id, payload);
  const session: Session = {
    ...state.session,
    status: "evaluated",
    evaluationRequested: true,
    lastActivityAt: new Date().toISOString(),
  };
  await storage.clearLastSessionPointer(session.scenarioId, session.id);
  return { ...state, session, evaluation };
}

export async function evaluateSessionById(
  sessionId: string,
  scenarioId?: string,
  testCasesContext?: string,
): Promise<Evaluation> {
  const scenario = scenarioId ? getScenarioById(scenarioId) : undefined;
  const productConfig = scenario ? await getProductConfigSnapshot() : undefined;
  const criteria = scenario
    ? buildScenarioEvaluationCriteria({
        scenario,
        scenarioEvaluationCriteria: productConfig?.scenarioEvaluationCriteria,
        fallbackCriteria: scenario.evaluationCriteria,
      })
    : undefined;
  const payload = scenario
    ? {
        criteria: criteria ?? scenario.evaluationCriteria,
        passingScore: scenario.passingScore,
        scenarioTitle: scenario.title,
        scenarioDescription: scenario.description,
        productContext: formatProductContext(scenario, productConfig),
        scenarioPrompt: buildScenarioContext(scenario) || scenario.kickoffPrompt,
        scenarioType: resolveScenarioType(scenario),
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
  return { ...state, session };
}

export async function updateMissionStatus(
  state: SessionState,
  missionId: string,
  completed: boolean,
): Promise<SessionState> {
  const missionStatus = [...(state.session.missionStatus ?? [])];
  const existingIndex = missionStatus.findIndex((mission) => mission.missionId === missionId);
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
  return { ...state, session };
}

export async function loadHistory(): Promise<HistoryItem[]> {
  return api.listSessions();
}
