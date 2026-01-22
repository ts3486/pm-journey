export type EvaluationCategory = {
  name: string;
  weight: number;
  score?: number;
  feedback?: string;
};

export type Evaluation = {
  sessionId: string;
  overallScore?: number;
  passing?: boolean;
  categories: EvaluationCategory[];
  summary?: string;
  improvementAdvice?: string;
};

export type ScenarioDiscipline = "BASIC" | "CHALLENGE";

export type ScenarioSummary = {
  id: string;
  title: string;
  description: string;
  discipline: ScenarioDiscipline;
};

export type ProgressFlags = {
  requirements: boolean;
  priorities: boolean;
  risks: boolean;
  acceptance: boolean;
};

export type Mission = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type MissionStatus = {
  missionId: string;
  completedAt?: string;
};

export type SessionStatus = "active" | "completed" | "evaluated";

export type Session = {
  id: string;
  scenarioId: string;
  scenarioDiscipline?: ScenarioDiscipline;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  userName?: string;
  progressFlags: ProgressFlags;
  evaluationRequested: boolean;
  missionStatus?: MissionStatus[];
  storageLocation?: "local" | "api";
};

export type MessageRole = "user" | "agent" | "system";
export type MessageTag = "decision" | "assumption" | "risk" | "next_action" | "summary";

export type Message = {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  tags?: MessageTag[];
  queuedOffline?: boolean;
};

export type HistoryMetadata = {
  duration?: number;
  messageCount?: number;
};

export type HistoryItem = {
  sessionId: string;
  scenarioId?: string;
  scenarioDiscipline?: ScenarioDiscipline;
  metadata: HistoryMetadata;
  actions: Message[];
  evaluation?: Evaluation;
  storageLocation?: "local" | "api";
  comments?: ManagerComment[];
};

export type Scenario = {
  id: string;
  title: string;
  description: string;
  discipline: ScenarioDiscipline;
  product: {
    name: string;
    summary: string;
    audience: string;
    problems: string[];
    goals: string[];
    differentiators: string[];
    scope: string[];
    constraints: string[];
    timeline: string;
    successCriteria: string[];
    uniqueEdge?: string;
    techStack?: string[];
    coreFeatures?: string[];
  };
  mode: string;
  kickoffPrompt: string;
  evaluationCriteria: EvaluationCategory[];
  passingScore?: number;
  missions?: Mission[];
  supplementalInfo?: string;
};

export type ManagerComment = {
  id: string;
  sessionId: string;
  authorName?: string;
  content: string;
  createdAt: string;
};

export type ScenarioCatalogSection = {
  discipline: ScenarioDiscipline;
  title: string;
  scenarios: ScenarioSummary[];
};
