import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionState } from "@/services/sessions";
import type { Session, Message, ProgressFlags, MissionStatus } from "@/types";

vi.mock("@/services/api", () => ({ api: {} }));
vi.mock("@/services/storage", () => ({ storage: {} }));
vi.mock("@/queries/scenarios", () => ({ getScenarioDiscipline: () => "BASIC" }));
vi.mock("@/lib/scenarioEvaluationCriteria", () => ({ buildScenarioEvaluationCriteria: () => [] }));

// Imported after mocks so the module resolves successfully
import { createLocalMessage, updateProgress, updateMissionStatus } from "@/services/sessions";

// ---- Helpers ----

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-1",
  scenarioId: "scenario-1",
  status: "active",
  startedAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  progressFlags: {
    requirements: false,
    priorities: false,
    risks: false,
    acceptance: false,
  },
  evaluationRequested: false,
  missionStatus: [],
  ...overrides,
});

const makeSessionState = (overrides: Partial<SessionState> = {}): SessionState => ({
  session: makeSession(),
  messages: [],
  history: [],
  loading: false,
  ...overrides,
});

// ---- createLocalMessage ----

describe("createLocalMessage", () => {
  it("returns a Message with the given sessionId", () => {
    const msg = createLocalMessage("session-abc", "user", "Hello");
    expect(msg.sessionId).toBe("session-abc");
  });

  it("returns a Message with the given role", () => {
    const msg = createLocalMessage("s1", "agent", "Hi");
    expect(msg.role).toBe("agent");
  });

  it("returns a Message with the given content", () => {
    const msg = createLocalMessage("s1", "user", "test content");
    expect(msg.content).toBe("test content");
  });

  it("includes a non-empty string id", () => {
    const msg = createLocalMessage("s1", "user", "content");
    expect(typeof msg.id).toBe("string");
    expect(msg.id.length).toBeGreaterThan(0);
  });

  it("generates a unique id on each call", () => {
    const a = createLocalMessage("s1", "user", "content");
    const b = createLocalMessage("s1", "user", "content");
    expect(a.id).not.toBe(b.id);
  });

  it("includes a createdAt timestamp in ISO 8601 format", () => {
    const before = new Date().toISOString();
    const msg = createLocalMessage("s1", "user", "content");
    const after = new Date().toISOString();
    expect(msg.createdAt >= before).toBe(true);
    expect(msg.createdAt <= after).toBe(true);
  });

  it("includes tags when provided", () => {
    const msg = createLocalMessage("s1", "user", "content", ["decision", "risk"]);
    expect(msg.tags).toEqual(["decision", "risk"]);
  });

  it("leaves tags undefined when not provided", () => {
    const msg = createLocalMessage("s1", "user", "content");
    expect(msg.tags).toBeUndefined();
  });

  it("returns a Message with correct shape for a system role", () => {
    const msg = createLocalMessage("s1", "system", "system message");
    expect(msg).toMatchObject<Partial<Message>>({
      sessionId: "s1",
      role: "system",
      content: "system message",
    });
  });

  it("accepts a single tag in the tags array", () => {
    const msg = createLocalMessage("s1", "agent", "reply", ["summary"]);
    expect(msg.tags).toEqual(["summary"]);
  });
});

// ---- updateProgress ----

describe("updateProgress", () => {
  it("sets a single flag to true", async () => {
    const state = makeSessionState();
    const next = await updateProgress(state, { requirements: true });
    expect(next.session.progressFlags.requirements).toBe(true);
  });

  it("leaves unspecified flags unchanged", async () => {
    const state = makeSessionState();
    const next = await updateProgress(state, { requirements: true });
    expect(next.session.progressFlags.priorities).toBe(false);
    expect(next.session.progressFlags.risks).toBe(false);
    expect(next.session.progressFlags.acceptance).toBe(false);
  });

  it("sets multiple flags at once", async () => {
    const state = makeSessionState();
    const next = await updateProgress(state, { priorities: true, risks: true });
    expect(next.session.progressFlags.priorities).toBe(true);
    expect(next.session.progressFlags.risks).toBe(true);
    expect(next.session.progressFlags.requirements).toBe(false);
    expect(next.session.progressFlags.acceptance).toBe(false);
  });

  it("can set a flag back to false", async () => {
    const state = makeSessionState({
      session: makeSession({
        progressFlags: {
          requirements: true,
          priorities: false,
          risks: false,
          acceptance: false,
        },
      }),
    });
    const next = await updateProgress(state, { requirements: false });
    expect(next.session.progressFlags.requirements).toBe(false);
  });

  it("can set all four flags to true", async () => {
    const state = makeSessionState();
    const allFlags: ProgressFlags = {
      requirements: true,
      priorities: true,
      risks: true,
      acceptance: true,
    };
    const next = await updateProgress(state, allFlags);
    expect(next.session.progressFlags).toEqual(allFlags);
  });

  it("does not mutate the original state", async () => {
    const state = makeSessionState();
    await updateProgress(state, { requirements: true });
    expect(state.session.progressFlags.requirements).toBe(false);
  });

  it("preserves other session fields", async () => {
    const state = makeSessionState({
      session: makeSession({ id: "session-xyz", scenarioId: "scenario-abc" }),
    });
    const next = await updateProgress(state, { acceptance: true });
    expect(next.session.id).toBe("session-xyz");
    expect(next.session.scenarioId).toBe("scenario-abc");
  });

  it("preserves messages and history from the state", async () => {
    const message: Message = {
      id: "msg-1",
      sessionId: "session-1",
      role: "user",
      content: "hello",
      createdAt: new Date().toISOString(),
    };
    const state = makeSessionState({ messages: [message], history: [] });
    const next = await updateProgress(state, { risks: true });
    expect(next.messages).toEqual([message]);
    expect(next.history).toEqual([]);
  });

  it("applying an empty partial object leaves flags unchanged", async () => {
    const flags: ProgressFlags = {
      requirements: true,
      priorities: true,
      risks: false,
      acceptance: false,
    };
    const state = makeSessionState({ session: makeSession({ progressFlags: flags }) });
    const next = await updateProgress(state, {});
    expect(next.session.progressFlags).toEqual(flags);
  });
});

// ---- updateMissionStatus ----

describe("updateMissionStatus", () => {
  it("adds a new mission entry when completed=true and no prior entry exists", async () => {
    const state = makeSessionState();
    const next = await updateMissionStatus(state, "mission-1", true);
    const status = next.session.missionStatus ?? [];
    expect(status).toHaveLength(1);
    expect(status[0].missionId).toBe("mission-1");
  });

  it("sets completedAt to a non-empty ISO string when completing a mission", async () => {
    const before = new Date().toISOString();
    const state = makeSessionState();
    const next = await updateMissionStatus(state, "mission-1", true);
    const after = new Date().toISOString();
    const entry = (next.session.missionStatus ?? [])[0];
    expect(entry.completedAt).toBeDefined();
    expect(entry.completedAt! >= before).toBe(true);
    expect(entry.completedAt! <= after).toBe(true);
  });

  it("updates an existing mission entry when completed=true", async () => {
    const existingEntry: MissionStatus = {
      missionId: "mission-1",
      completedAt: "2024-01-01T00:00:00.000Z",
    };
    const state = makeSessionState({
      session: makeSession({ missionStatus: [existingEntry] }),
    });
    const before = new Date().toISOString();
    const next = await updateMissionStatus(state, "mission-1", true);
    const after = new Date().toISOString();
    const statuses = next.session.missionStatus ?? [];
    expect(statuses).toHaveLength(1);
    expect(statuses[0].missionId).toBe("mission-1");
    expect(statuses[0].completedAt! >= before).toBe(true);
    expect(statuses[0].completedAt! <= after).toBe(true);
  });

  it("removes a mission entry when completed=false and the mission exists", async () => {
    const existing: MissionStatus = { missionId: "mission-1", completedAt: "2024-01-01T00:00:00.000Z" };
    const state = makeSessionState({
      session: makeSession({ missionStatus: [existing] }),
    });
    const next = await updateMissionStatus(state, "mission-1", false);
    const statuses = next.session.missionStatus ?? [];
    expect(statuses).toHaveLength(0);
  });

  it("is a no-op when completed=false and the mission does not exist", async () => {
    const state = makeSessionState();
    const next = await updateMissionStatus(state, "mission-x", false);
    expect(next.session.missionStatus ?? []).toHaveLength(0);
  });

  it("removes only the matching mission and leaves others intact", async () => {
    const m1: MissionStatus = { missionId: "mission-1", completedAt: "2024-01-01T00:00:00.000Z" };
    const m2: MissionStatus = { missionId: "mission-2", completedAt: "2024-01-02T00:00:00.000Z" };
    const state = makeSessionState({
      session: makeSession({ missionStatus: [m1, m2] }),
    });
    const next = await updateMissionStatus(state, "mission-1", false);
    const statuses = next.session.missionStatus ?? [];
    expect(statuses).toHaveLength(1);
    expect(statuses[0].missionId).toBe("mission-2");
  });

  it("does not mutate the original missionStatus array", async () => {
    const original: MissionStatus[] = [];
    const state = makeSessionState({ session: makeSession({ missionStatus: original }) });
    await updateMissionStatus(state, "mission-1", true);
    expect(original).toHaveLength(0);
  });

  it("updates lastActivityAt on the session", async () => {
    const before = new Date().toISOString();
    const state = makeSessionState({
      session: makeSession({ lastActivityAt: "2020-01-01T00:00:00.000Z" }),
    });
    const next = await updateMissionStatus(state, "mission-1", true);
    const after = new Date().toISOString();
    expect(next.session.lastActivityAt >= before).toBe(true);
    expect(next.session.lastActivityAt <= after).toBe(true);
  });

  it("preserves other session fields when adding a mission", async () => {
    const state = makeSessionState({
      session: makeSession({ id: "session-abc", scenarioId: "scenario-xyz" }),
    });
    const next = await updateMissionStatus(state, "mission-1", true);
    expect(next.session.id).toBe("session-abc");
    expect(next.session.scenarioId).toBe("scenario-xyz");
  });

  it("correctly adds a second distinct mission alongside an existing one", async () => {
    const m1: MissionStatus = { missionId: "mission-1", completedAt: "2024-01-01T00:00:00.000Z" };
    const state = makeSessionState({
      session: makeSession({ missionStatus: [m1] }),
    });
    const next = await updateMissionStatus(state, "mission-2", true);
    const statuses = next.session.missionStatus ?? [];
    expect(statuses).toHaveLength(2);
    expect(statuses.map((s) => s.missionId)).toContain("mission-1");
    expect(statuses.map((s) => s.missionId)).toContain("mission-2");
  });

  it("handles missionStatus being undefined on the session", async () => {
    const state = makeSessionState({
      session: makeSession({ missionStatus: undefined }),
    });
    const next = await updateMissionStatus(state, "mission-1", true);
    const statuses = next.session.missionStatus ?? [];
    expect(statuses).toHaveLength(1);
    expect(statuses[0].missionId).toBe("mission-1");
  });
});
