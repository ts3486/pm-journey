import { describe, it, expect } from "vitest";
import {
  createEmptyPromptSections,
  parsePromptSections,
  buildPromptFromSections,
  buildDefaultSectionsFromConfig,
  getInitialSections,
  getBaselinePrompt,
  buildProjectOverviewData,
  normalizePrompt,
} from "./productPromptSections";

// ---- createEmptyPromptSections ----

describe("createEmptyPromptSections", () => {
  it("returns all 6 section keys as empty strings", () => {
    const sections = createEmptyPromptSections();
    expect(Object.keys(sections)).toHaveLength(6);
    expect(sections.context).toBe("");
    expect(sections.usersAndProblems).toBe("");
    expect(sections.goalsAndSuccess).toBe("");
    expect(sections.scopeAndFeatures).toBe("");
    expect(sections.constraintsAndTimeline).toBe("");
    expect(sections.differentiation).toBe("");
  });
});

// ---- normalizePrompt ----

describe("normalizePrompt", () => {
  it("trims whitespace", () => {
    expect(normalizePrompt("  hello  ")).toBe("hello");
  });

  it("returns empty string for undefined", () => {
    expect(normalizePrompt(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(normalizePrompt("")).toBe("");
  });
});

// ---- parsePromptSections ----

describe("parsePromptSections", () => {
  it("parses sections from ## headings", () => {
    const prompt = [
      "## プロジェクト背景",
      "背景の内容",
      "",
      "## 対象ユーザーと課題",
      "ユーザーの情報",
    ].join("\n");

    const sections = parsePromptSections(prompt);
    expect(sections.context).toBe("背景の内容");
    expect(sections.usersAndProblems).toBe("ユーザーの情報");
    expect(sections.goalsAndSuccess).toBe("");
  });

  it("recognizes alias headings (case-insensitive)", () => {
    const prompt = "## project context\nSome content";
    const sections = parsePromptSections(prompt);
    expect(sections.context).toBe("Some content");
  });

  it("puts unrecognized headings and orphan lines into differentiation", () => {
    const prompt = [
      "Orphan line at top",
      "## Unknown Heading",
      "Content under unknown",
    ].join("\n");

    const sections = parsePromptSections(prompt);
    expect(sections.differentiation).toContain("Orphan line at top");
    expect(sections.differentiation).toContain("## Unknown Heading");
    expect(sections.differentiation).toContain("Content under unknown");
  });

  it("appends fallback content to existing differentiation", () => {
    const prompt = [
      "## 差別化ポイントと補足",
      "既存の内容",
      "## Unknown",
      "Fallback content",
    ].join("\n");

    const sections = parsePromptSections(prompt);
    expect(sections.differentiation).toContain("既存の内容");
    expect(sections.differentiation).toContain("Fallback content");
  });

  it("handles empty input", () => {
    const sections = parsePromptSections("");
    expect(sections.context).toBe("");
    expect(sections.differentiation).toBe("");
  });

  it("trims section content", () => {
    const prompt = "## プロジェクト背景\n  content with spaces  \n  ";
    const sections = parsePromptSections(prompt);
    expect(sections.context).toBe("content with spaces");
  });

  it("handles CRLF line endings", () => {
    const prompt = "## プロジェクト背景\r\ncontent\r\n## 目標と成功条件\r\ngoals";
    const sections = parsePromptSections(prompt);
    expect(sections.context).toBe("content");
    expect(sections.goalsAndSuccess).toBe("goals");
  });
});

// ---- buildPromptFromSections ----

describe("buildPromptFromSections", () => {
  it("builds prompt with ## headings for non-empty sections", () => {
    const sections = createEmptyPromptSections();
    sections.context = "背景内容";
    sections.goalsAndSuccess = "ゴール内容";

    const prompt = buildPromptFromSections(sections);
    expect(prompt).toBe("## プロジェクト背景\n背景内容\n\n## 目標と成功条件\nゴール内容");
  });

  it("skips empty sections", () => {
    const sections = createEmptyPromptSections();
    sections.context = "Only context";

    const prompt = buildPromptFromSections(sections);
    expect(prompt).toBe("## プロジェクト背景\nOnly context");
    expect(prompt).not.toContain("対象ユーザー");
  });

  it("returns empty string when all sections are empty", () => {
    const prompt = buildPromptFromSections(createEmptyPromptSections());
    expect(prompt).toBe("");
  });

  it("round-trips with parsePromptSections", () => {
    const original = createEmptyPromptSections();
    original.context = "背景";
    original.usersAndProblems = "ユーザー";
    original.goalsAndSuccess = "ゴール";
    original.scopeAndFeatures = "スコープ";
    original.constraintsAndTimeline = "制約";
    original.differentiation = "差別化";

    const prompt = buildPromptFromSections(original);
    const parsed = parsePromptSections(prompt);
    expect(parsed).toEqual(original);
  });
});

// ---- buildDefaultSectionsFromConfig ----

describe("buildDefaultSectionsFromConfig", () => {
  it("maps product config fields to sections", () => {
    const sections = buildDefaultSectionsFromConfig({
      name: "テストアプリ",
      summary: "概要文",
      audience: "エンジニア",
      problems: ["問題1", "問題2"],
      goals: ["目標1"],
      differentiators: ["差別化1"],
      scope: ["スコープ1"],
      constraints: ["制約1"],
      timeline: "3ヶ月",
      successCriteria: ["成功基準1"],
      uniqueEdge: "ユニーク",
      techStack: [],
      coreFeatures: ["機能1"],
    });

    expect(sections.context).toContain("テストアプリ");
    expect(sections.context).toContain("概要文");
    expect(sections.usersAndProblems).toContain("エンジニア");
    expect(sections.usersAndProblems).toContain("問題1");
    expect(sections.goalsAndSuccess).toContain("目標1");
    expect(sections.goalsAndSuccess).toContain("成功基準1");
    expect(sections.scopeAndFeatures).toContain("スコープ1");
    expect(sections.scopeAndFeatures).toContain("機能1");
    expect(sections.constraintsAndTimeline).toContain("3ヶ月");
    expect(sections.constraintsAndTimeline).toContain("制約1");
    expect(sections.differentiation).toContain("差別化1");
    expect(sections.differentiation).toContain("ユニーク");
  });

  it("handles empty/missing fields gracefully", () => {
    const sections = buildDefaultSectionsFromConfig({
      name: "",
      summary: "",
      audience: "",
      problems: [],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
    });

    expect(sections.context).toBe("");
    expect(sections.usersAndProblems).toBe("");
    expect(sections.goalsAndSuccess).toBe("");
  });

  it("filters out empty strings from list fields", () => {
    const sections = buildDefaultSectionsFromConfig({
      name: "App",
      summary: "",
      audience: "",
      problems: ["valid", "", "  "],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
    });

    expect(sections.usersAndProblems).toContain("valid");
    expect(sections.usersAndProblems).not.toContain("- \n");
  });
});

// ---- getInitialSections ----

describe("getInitialSections", () => {
  it("parses saved productPrompt when available", () => {
    const sections = getInitialSections({
      name: "App",
      summary: "",
      audience: "",
      problems: [],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
      productPrompt: "## プロジェクト背景\nSaved content",
    });
    expect(sections.context).toBe("Saved content");
  });

  it("builds from config when no productPrompt is saved", () => {
    const sections = getInitialSections({
      name: "テストApp",
      summary: "概要",
      audience: "",
      problems: [],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
    });
    expect(sections.context).toContain("テストApp");
  });

  it("treats whitespace-only productPrompt as absent", () => {
    const sections = getInitialSections({
      name: "App",
      summary: "summary",
      audience: "",
      problems: [],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
      productPrompt: "   ",
    });
    expect(sections.context).toContain("App");
  });
});

// ---- getBaselinePrompt ----

describe("getBaselinePrompt", () => {
  it("returns empty string when config is undefined", () => {
    expect(getBaselinePrompt(undefined)).toBe("");
  });

  it("returns saved productPrompt when available", () => {
    const result = getBaselinePrompt({
      name: "",
      summary: "",
      audience: "",
      problems: [],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
      productPrompt: "## プロジェクト背景\nCustom",
    });
    expect(result).toContain("Custom");
  });

  it("builds from config fields when no productPrompt is saved", () => {
    const result = getBaselinePrompt({
      name: "App",
      summary: "A test app",
      audience: "",
      problems: [],
      goals: [],
      differentiators: [],
      scope: [],
      constraints: [],
      successCriteria: [],
      techStack: [],
      coreFeatures: [],
    });
    expect(result).toContain("App");
    expect(result).toContain("## プロジェクト背景");
  });
});

// ---- buildProjectOverviewData ----

describe("buildProjectOverviewData", () => {
  it("returns overview data from product config without prompt template", () => {
    const result = buildProjectOverviewData({
      scenario: {
        title: "テストシナリオ",
        description: "テストの説明",
        scenarioType: "soft-skills",
      },
      productConfig: {
        name: "テストApp",
        summary: "概要",
        audience: "ユーザー",
        problems: ["問題A"],
        goals: ["目標A"],
        differentiators: [],
        scope: [],
        constraints: [],
        successCriteria: [],
        techStack: [],
        coreFeatures: [],
        scenarioEvaluationCriteria: {
          softSkills: [],
          testCases: [],
          requirementDefinition: [],
          incidentResponse: [],
          businessExecution: [],
        },
        isDefault: false,
      },
    });

    expect(result.productName).toBe("テストApp");
    expect(result.summary).toBe("概要");
    expect(result.audience).toBe("ユーザー");
    expect(result.sections).toHaveLength(6);
    expect(result.configuredSectionCount).toBeGreaterThan(0);
  });

  it("renders template variables in productPrompt", () => {
    const result = buildProjectOverviewData({
      scenario: {
        title: "ログインテスト",
        description: "ログインのテスト",
        scenarioType: "test-cases",
      },
      productConfig: {
        name: "MyApp",
        summary: "My summary",
        audience: "Developers",
        problems: [],
        goals: [],
        differentiators: [],
        scope: [],
        constraints: [],
        successCriteria: [],
        techStack: [],
        coreFeatures: [],
        productPrompt: "## プロジェクト背景\nシナリオ: {{ scenarioTitle }}\n製品: {{ productName }}",
        scenarioEvaluationCriteria: {
          softSkills: [],
          testCases: [],
          requirementDefinition: [],
          incidentResponse: [],
          businessExecution: [],
        },
        isDefault: false,
      },
    });

    const contextSection = result.sections.find((s) => s.key === "context");
    expect(contextSection?.lines).toContain("シナリオ: ログインテスト");
    expect(contextSection?.lines).toContain("製品: MyApp");
  });

  it("handles missing productConfig gracefully", () => {
    const result = buildProjectOverviewData({
      scenario: {
        title: "テスト",
        description: "説明",
        scenarioType: "soft-skills",
      },
    });

    expect(result.productName).toBe("");
    expect(result.configuredSectionCount).toBe(0);
  });
});
