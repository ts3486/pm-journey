import { describe, expect, it, vi } from "vitest";
import { listOutputs, addOutput, deleteOutput } from "@/services/outputs";
import { api } from "@/services/api";
import type { OutputSubmission } from "@/types";

vi.mock("@/services/api", () => ({
  api: {
    listOutputs: vi.fn(),
    createOutput: vi.fn(),
    deleteOutput: vi.fn(),
  },
}));

const listOutputsMock = vi.mocked(api.listOutputs);
const createOutputMock = vi.mocked(api.createOutput);
const deleteOutputMock = vi.mocked(api.deleteOutput);

const makeOutputSubmission = (overrides: Partial<OutputSubmission> = {}): OutputSubmission => ({
  id: "output-1",
  sessionId: "session-1",
  kind: "text",
  value: "some value",
  createdAt: new Date().toISOString(),
  ...overrides,
});

// ---- listOutputs ----

describe("listOutputs", () => {
  it("delegates to api.listOutputs with sessionId", async () => {
    listOutputsMock.mockResolvedValueOnce([]);

    await listOutputs("session-abc");

    expect(listOutputsMock).toHaveBeenCalledWith("session-abc");
  });

  it("returns the array from the API", async () => {
    const outputs = [
      makeOutputSubmission({ id: "output-1" }),
      makeOutputSubmission({ id: "output-2", kind: "url", value: "https://example.com" }),
    ];
    listOutputsMock.mockResolvedValueOnce(outputs);

    const result = await listOutputs("session-1");

    expect(result).toEqual(outputs);
  });
});

// ---- addOutput ----

describe("addOutput", () => {
  it("passes sessionId, kind, value, and note to api.createOutput", async () => {
    const output = makeOutputSubmission({ note: "my note" });
    createOutputMock.mockResolvedValueOnce(output);

    await addOutput("session-1", "text", "some value", "my note");

    expect(createOutputMock).toHaveBeenCalledWith("session-1", {
      kind: "text",
      value: "some value",
      note: "my note",
    });
  });

  it("omits note when not provided", async () => {
    const output = makeOutputSubmission();
    createOutputMock.mockResolvedValueOnce(output);

    await addOutput("session-1", "url", "https://example.com");

    expect(createOutputMock).toHaveBeenCalledWith("session-1", {
      kind: "url",
      value: "https://example.com",
      note: undefined,
    });
  });
});

// ---- deleteOutput ----

describe("deleteOutput", () => {
  it("calls api.deleteOutput with sessionId and outputId", async () => {
    deleteOutputMock.mockResolvedValueOnce(undefined);

    await deleteOutput("session-1", "output-42");

    expect(deleteOutputMock).toHaveBeenCalledWith("session-1", "output-42");
  });

  it("returns void", async () => {
    deleteOutputMock.mockResolvedValueOnce(undefined);

    const result = await deleteOutput("session-1", "output-42");

    expect(result).toBeUndefined();
  });
});
