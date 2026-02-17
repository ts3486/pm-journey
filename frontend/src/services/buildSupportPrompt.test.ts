import { describe, expect, it } from "vitest";
import { buildSupportPrompt, buildAssistanceModeRules } from "@/services/sessions";
import type { Scenario, ProductConfig } from "@/types";
import type { AgentProfile } from "@/config";

const supportProfile: AgentProfile = {
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたはPMスキル学習の支援アシスタントです。",
  tonePrompt: "学習を支援する親しみやすいコーチとして振る舞う",
};

const minimalProduct: Scenario["product"] = {
  name: "",
  summary: "",
  audience: "",
  problems: [],
  goals: [],
  differentiators: [],
  scope: [],
  constraints: [],
  timeline: "",
  successCriteria: [],
};

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "test-scenario",
    title: "テストシナリオ",
    description: "テスト用のシナリオ",
    discipline: "BASIC",
    product: minimalProduct,
    mode: "guided",
    kickoffPrompt: "テストを開始してください。",
    evaluationCriteria: [],
    task: {
      instruction: "テストタスクの指示です。",
      deliverableFormat: "structured",
    },
    assistanceMode: "on-request",
    ...overrides,
  };
}

describe("buildSupportPrompt", () => {
  it("returns agentContext with scenarioPrompt containing task instruction", () => {
    const scenario = makeScenario();
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("## タスク指示");
    expect(result.scenarioPrompt).toContain("テストタスクの指示です。");
  });

  it("includes template sections in scenarioPrompt when template has sections", () => {
    const scenario = makeScenario({
      task: {
        instruction: "指示テスト",
        deliverableFormat: "structured",
        template: {
          format: "structured",
          sections: ["目的", "受入条件", "依存関係"],
        },
      },
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("期待される構成:");
    expect(result.scenarioPrompt).toContain("- 目的");
    expect(result.scenarioPrompt).toContain("- 受入条件");
    expect(result.scenarioPrompt).toContain("- 依存関係");
  });

  it("includes template example in scenarioPrompt when template has example", () => {
    const scenario = makeScenario({
      task: {
        instruction: "指示テスト",
        deliverableFormat: "structured",
        template: {
          format: "structured",
          example: "## 目的\nサンプルの成果物です。",
        },
      },
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("## 成果物の例");
    expect(result.scenarioPrompt).toContain("サンプルの成果物です。");
  });

  it("includes referenceInfo as background section in scenarioPrompt", () => {
    const scenario = makeScenario({
      task: {
        instruction: "指示テスト",
        deliverableFormat: "free-text",
        referenceInfo: "プロジェクトの背景情報です。",
      },
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("## 背景情報");
    expect(result.scenarioPrompt).toContain("プロジェクトの背景情報です。");
  });

  it("does not include customPrompt in returned agentContext", () => {
    const scenario = makeScenario({
      customPrompt: "あなたはエンジニアです。",
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result).not.toHaveProperty("customPrompt");
  });

  it("uses support systemPrompt and tonePrompt from SUPPORT profile", () => {
    const scenario = makeScenario();
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.systemPrompt).toBe(supportProfile.systemPrompt);
    expect(result.tonePrompt).toBe(supportProfile.tonePrompt);
    expect(result.modelId).toBe(supportProfile.modelId);
  });

  it("includes productContext from formatProductContext", () => {
    const productConfig: ProductConfig = {
      name: "勤怠アプリ",
      summary: "社内勤怠管理ツール",
      audience: "社員",
      problems: [],
      goals: [],
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
      isDefault: true,
    };
    const scenario = makeScenario();
    const result = buildSupportPrompt({ scenario, productConfig, profile: supportProfile });

    expect(result.productContext).toContain("勤怠アプリ");
  });

  it("includes task definition in returned agentContext", () => {
    const scenario = makeScenario({
      task: {
        instruction: "テスト指示",
        deliverableFormat: "checklist",
        hints: ["ヒント1", "ヒント2"],
      },
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.task).toBeDefined();
    expect(result.task.instruction).toBe("テスト指示");
    expect(result.task.deliverableFormat).toBe("checklist");
    expect(result.task.hints).toEqual(["ヒント1", "ヒント2"]);
  });

  it("includes scenarioTitle and scenarioDescription from scenario", () => {
    const scenario = makeScenario({
      title: "カスタムタイトル",
      description: "カスタム説明",
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioTitle).toBe("カスタムタイトル");
    expect(result.scenarioDescription).toBe("カスタム説明");
  });

  it("includes assistance mode rules in scenarioPrompt", () => {
    const scenario = makeScenario({ assistanceMode: "guided" });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("ガイド付き");
  });

  it("falls back to behavior.assistanceMode when scenario.assistanceMode is undefined", () => {
    const scenario = makeScenario({
      assistanceMode: undefined,
      behavior: { assistanceMode: "review" },
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("レビュー");
  });

  it("defaults to on-request when no assistanceMode is specified", () => {
    const scenario = makeScenario({
      assistanceMode: undefined,
      behavior: {},
    });
    const result = buildSupportPrompt({ scenario, profile: supportProfile });

    expect(result.scenarioPrompt).toContain("質問対応");
  });
});

describe("buildAssistanceModeRules", () => {
  it("returns hands-off rules containing '見守り' for 'hands-off' mode", () => {
    const result = buildAssistanceModeRules("hands-off");
    expect(result).toContain("見守り");
    expect(result).toContain("質問には答えない");
  });

  it("returns on-request rules containing '質問対応' for 'on-request' mode", () => {
    const result = buildAssistanceModeRules("on-request");
    expect(result).toContain("質問対応");
    expect(result).toContain("質問があった場合のみ応答する");
  });

  it("returns guided rules containing 'ガイド付き' for 'guided' mode", () => {
    const result = buildAssistanceModeRules("guided");
    expect(result).toContain("ガイド付き");
    expect(result).toContain("次のステップを提案してよい");
  });

  it("returns review rules containing 'レビュー' for 'review' mode", () => {
    const result = buildAssistanceModeRules("review");
    expect(result).toContain("レビュー");
    expect(result).toContain("改善ポイントをフィードバック");
  });
});
