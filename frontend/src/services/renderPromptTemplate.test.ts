import { describe, it, expect } from "vitest";

/**
 * Tests for the prompt template rendering logic used in sessions.ts.
 * This is a critical path because the rendered prompt is sent to the AI agent.
 * The function is module-private, so we test an extracted copy of the logic.
 */

const renderPromptTemplate = (
  template: string,
  variables: Record<string, string | undefined>,
) => {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => variables[key] ?? "");
};

const defaultVars: Record<string, string | undefined> = {
  scenarioTitle: "テストシナリオ",
  scenarioDescription: "テスト説明",
  scenarioDiscipline: "BASIC",
  scenarioType: "soft-skills",
  productName: undefined,
  productSummary: undefined,
  productAudience: undefined,
  productTimeline: undefined,
};

describe("renderPromptTemplate", () => {
  it("replaces scenarioTitle placeholder", () => {
    const result = renderPromptTemplate("Title: {{ scenarioTitle }}", defaultVars);
    expect(result).toBe("Title: テストシナリオ");
  });

  it("replaces scenarioDescription placeholder", () => {
    const result = renderPromptTemplate("Desc: {{scenarioDescription}}", defaultVars);
    expect(result).toBe("Desc: テスト説明");
  });

  it("replaces productName from productConfig", () => {
    const result = renderPromptTemplate(
      "Product: {{ productName }}",
      { ...defaultVars, productName: "MyApp" },
    );
    expect(result).toBe("Product: MyApp");
  });

  it("replaces unknown placeholders with empty string", () => {
    const result = renderPromptTemplate("Unknown: {{ unknownVar }}", defaultVars);
    expect(result).toBe("Unknown: ");
  });

  it("handles template with no placeholders", () => {
    const result = renderPromptTemplate("No placeholders here", defaultVars);
    expect(result).toBe("No placeholders here");
  });

  it("handles multiple placeholders in one template", () => {
    const result = renderPromptTemplate(
      "{{ scenarioTitle }} - {{ scenarioDescription }}",
      defaultVars,
    );
    expect(result).toBe("テストシナリオ - テスト説明");
  });

  it("replaces undefined fields with empty string", () => {
    const result = renderPromptTemplate(
      "Timeline: {{ productTimeline }}",
      defaultVars,
    );
    expect(result).toBe("Timeline: ");
  });

  it("handles whitespace variations in placeholder syntax", () => {
    const result = renderPromptTemplate(
      "{{scenarioTitle}} / {{ scenarioTitle }} / {{  scenarioTitle  }}",
      defaultVars,
    );
    expect(result).toBe("テストシナリオ / テストシナリオ / テストシナリオ");
  });

  it("empty template returns empty string", () => {
    const result = renderPromptTemplate("", defaultVars);
    expect(result).toBe("");
  });

  it("preserves text around placeholders", () => {
    const result = renderPromptTemplate(
      "Before {{ scenarioTitle }} After",
      defaultVars,
    );
    expect(result).toBe("Before テストシナリオ After");
  });
});
