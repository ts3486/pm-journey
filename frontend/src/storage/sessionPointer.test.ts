import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSessionPointerStorage, SESSION_POINTER_CHANGED_EVENT } from "./sessionPointer";

// ---- Setup ----

const mockStorage = new Map<string, string>();

beforeEach(() => {
  mockStorage.clear();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => mockStorage.get(key) ?? null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    mockStorage.set(key, value);
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
    mockStorage.delete(key);
  });
});

const makeStorage = (userId?: string) =>
  createSessionPointerStorage({ keyPrefix: "test", userId });

// ---- Tests ----

describe("createSessionPointerStorage", () => {
  describe("setLastSession + loadLastSessionId", () => {
    it("stores and retrieves session ID for a given scenario", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      const loaded = await s.loadLastSessionId("scenario-a");
      expect(loaded).toBe("sess-1");
    });

    it("returns null for unknown scenario", async () => {
      const s = makeStorage();
      const loaded = await s.loadLastSessionId("unknown-scenario");
      expect(loaded).toBeNull();
    });

    it("overwrites previous session for the same scenario", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      s.setLastSession("sess-2", "scenario-a");
      const loaded = await s.loadLastSessionId("scenario-a");
      expect(loaded).toBe("sess-2");
    });

    it("keeps sessions separate across scenarios", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      s.setLastSession("sess-2", "scenario-b");
      expect(await s.loadLastSessionId("scenario-a")).toBe("sess-1");
      expect(await s.loadLastSessionId("scenario-b")).toBe("sess-2");
    });

    it("isolates data by userId prefix", async () => {
      const s1 = makeStorage("user-1");
      const s2 = makeStorage("user-2");
      s1.setLastSession("sess-1", "scenario-a");
      s2.setLastSession("sess-2", "scenario-a");
      expect(await s1.loadLastSessionId("scenario-a")).toBe("sess-1");
      expect(await s2.loadLastSessionId("scenario-a")).toBe("sess-2");
    });
  });

  describe("loadLastSessionId without scenarioId", () => {
    it("falls back to last stored scenario", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      const loaded = await s.loadLastSessionId();
      expect(loaded).toBe("sess-1");
    });

    it("returns null when no scenario was stored", async () => {
      const s = makeStorage();
      const loaded = await s.loadLastSessionId();
      expect(loaded).toBeNull();
    });
  });

  describe("loadLastScenarioId", () => {
    it("returns the scenario from the most recent setLastSession call", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      s.setLastSession("sess-2", "scenario-b");
      expect(await s.loadLastScenarioId()).toBe("scenario-b");
    });

    it("returns null when nothing stored", async () => {
      const s = makeStorage();
      expect(await s.loadLastScenarioId()).toBeNull();
    });
  });

  describe("clearLastSessionPointer", () => {
    it("clears session pointer when matching sessionId is provided", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      await s.clearLastSessionPointer("scenario-a", "sess-1");
      expect(await s.loadLastSessionId("scenario-a")).toBeNull();
    });

    it("does not clear when sessionId does not match", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      await s.clearLastSessionPointer("scenario-a", "sess-999");
      expect(await s.loadLastSessionId("scenario-a")).toBe("sess-1");
    });

    it("clears unconditionally when sessionId is omitted", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      await s.clearLastSessionPointer("scenario-a");
      expect(await s.loadLastSessionId("scenario-a")).toBeNull();
    });
  });

  describe("events", () => {
    it("dispatches change event on setLastSession", () => {
      const handler = vi.fn();
      window.addEventListener(SESSION_POINTER_CHANGED_EVENT, handler);
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener(SESSION_POINTER_CHANGED_EVENT, handler);
    });

    it("dispatches change event on clearLastSessionPointer", async () => {
      const s = makeStorage();
      s.setLastSession("sess-1", "scenario-a");
      const handler = vi.fn();
      window.addEventListener(SESSION_POINTER_CHANGED_EVENT, handler);
      await s.clearLastSessionPointer("scenario-a");
      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener(SESSION_POINTER_CHANGED_EVENT, handler);
    });
  });
});
