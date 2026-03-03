import { describe, it, expect } from "vitest";
import { serializeIncidentResponseForm } from "./IncidentResponseForm";

describe("serializeIncidentResponseForm", () => {
  it("serializes all required sections", () => {
    const result = serializeIncidentResponseForm({
      impactScope: "全ユーザー影響",
      initialResponse: "ロールバック実施",
      stakeholderNotice: "障害報告メール",
      rootCausePrevention: "",
    });

    expect(result).toContain("## 影響範囲の整理");
    expect(result).toContain("全ユーザー影響");
    expect(result).toContain("## 初動対応方針");
    expect(result).toContain("ロールバック実施");
    expect(result).toContain("## ステークホルダー連絡文");
    expect(result).toContain("障害報告メール");
  });

  it("includes root cause section when provided", () => {
    const result = serializeIncidentResponseForm({
      impactScope: "影響範囲",
      initialResponse: "初動",
      stakeholderNotice: "連絡",
      rootCausePrevention: "DB接続プール枯渇",
    });

    expect(result).toContain("## 原因分析と再発防止");
    expect(result).toContain("DB接続プール枯渇");
  });

  it("excludes root cause section when empty", () => {
    const result = serializeIncidentResponseForm({
      impactScope: "影響",
      initialResponse: "初動",
      stakeholderNotice: "連絡",
      rootCausePrevention: "",
    });

    expect(result).not.toContain("## 原因分析と再発防止");
  });

  it("excludes root cause section when whitespace-only", () => {
    const result = serializeIncidentResponseForm({
      impactScope: "影響",
      initialResponse: "初動",
      stakeholderNotice: "連絡",
      rootCausePrevention: "   ",
    });

    expect(result).not.toContain("## 原因分析と再発防止");
  });

  it("separates sections with double newlines", () => {
    const result = serializeIncidentResponseForm({
      impactScope: "影響",
      initialResponse: "初動",
      stakeholderNotice: "連絡",
      rootCausePrevention: "",
    });

    const sections = result.split("\n\n");
    expect(sections).toHaveLength(3);
  });
});
