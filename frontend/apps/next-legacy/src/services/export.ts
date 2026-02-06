import type { HistoryItem } from "@pm-journey/types";

export function exportAsJson(item: HistoryItem): string {
  return JSON.stringify(item, null, 2);
}

export function exportAsMarkdown(item: HistoryItem): string {
  const lines: string[] = [];
  lines.push(`# Session ${item.sessionId}`);
  lines.push("");
  if (item.metadata.messageCount !== undefined) {
    lines.push(`Messages: ${item.metadata.messageCount}`);
  }
  lines.push("");
  if (item.evaluation) {
    lines.push("## Evaluation");
    lines.push(`Overall: ${item.evaluation.overallScore ?? "-"} (passing: ${item.evaluation.passing})`);
    lines.push("Categories:");
    item.evaluation.categories.forEach((c) => {
      lines.push(`- ${c.name}: ${c.score ?? "-"} (${c.weight}%) ${c.feedback ?? ""}`);
    });
  }
  lines.push("");
  lines.push("## Actions");
  item.actions.forEach((m) => {
    lines.push(`- [${m.tags?.join(", ")}] ${m.content}`);
  });
  return lines.join("\n");
}
