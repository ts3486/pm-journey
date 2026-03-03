import { describe, it, expect } from "vitest";
import { serializeBusinessExecutionForm } from "./BusinessExecutionForm";

describe("serializeBusinessExecutionForm", () => {
  it("serializes all four sections", () => {
    const result = serializeBusinessExecutionForm({
      currentAnalysis: "現状分析内容",
      proposalAndRationale: "提案内容",
      tradeoffs: "トレードオフ",
      executionPlan: "実行計画",
    });

    expect(result).toContain("## 現状分析と課題");
    expect(result).toContain("現状分析内容");
    expect(result).toContain("## 提案と根拠");
    expect(result).toContain("提案内容");
    expect(result).toContain("## トレードオフの整理");
    expect(result).toContain("トレードオフ");
    expect(result).toContain("## 実行計画");
    expect(result).toContain("実行計画");
  });

  it("always includes all 4 sections even when content is empty", () => {
    const result = serializeBusinessExecutionForm({
      currentAnalysis: "",
      proposalAndRationale: "",
      tradeoffs: "",
      executionPlan: "",
    });

    expect(result).toContain("## 現状分析と課題");
    expect(result).toContain("## 提案と根拠");
    expect(result).toContain("## トレードオフの整理");
    expect(result).toContain("## 実行計画");
  });

  it("separates sections with double newlines", () => {
    const result = serializeBusinessExecutionForm({
      currentAnalysis: "A",
      proposalAndRationale: "B",
      tradeoffs: "C",
      executionPlan: "D",
    });

    const sections = result.split("\n\n");
    expect(sections).toHaveLength(4);
  });

  it("preserves multiline content within sections", () => {
    const result = serializeBusinessExecutionForm({
      currentAnalysis: "Line 1\nLine 2\nLine 3",
      proposalAndRationale: "",
      tradeoffs: "",
      executionPlan: "",
    });

    expect(result).toContain("Line 1\nLine 2\nLine 3");
  });
});
