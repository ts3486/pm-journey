export type BusinessExecutionFormData = {
  currentAnalysis: string;
  proposalAndRationale: string;
  tradeoffs: string;
  executionPlan: string;
};

export function serializeBusinessExecutionForm(data: BusinessExecutionFormData): string {
  return [
    `## 現状分析と課題\n${data.currentAnalysis}`,
    `## 提案と根拠\n${data.proposalAndRationale}`,
    `## トレードオフの整理\n${data.tradeoffs}`,
    `## 実行計画\n${data.executionPlan}`,
  ].join("\n\n");
}

type BusinessExecutionFormProps = {
  value: BusinessExecutionFormData;
  onChange: (value: BusinessExecutionFormData) => void;
  disabled?: boolean;
};

const fields: {
  key: keyof BusinessExecutionFormData;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "currentAnalysis",
    label: "現状分析と課題",
    placeholder:
      "例:\n- 現在の状況: 3案が候補として並行検討中\n- 課題: リソース制約（4名×3ヶ月）で全案同時着手は不可能\n- ステークホルダー間で優先度の認識が異なる",
  },
  {
    key: "proposalAndRationale",
    label: "提案と根拠",
    placeholder:
      "例:\n推奨案: A案（高速検索）を第1フェーズで実施\n根拠:\n- 検索離脱率30%改善で月間¥XXXの売上インパクト\n- 競合対策としての緊急性が最も高い\n- 技術的な前提条件が整っている",
  },
  {
    key: "tradeoffs",
    label: "トレードオフの整理",
    placeholder:
      "例:\n| 観点 | A案 | B案 | C案 |\n|------|-----|-----|-----|\n| ビジネス価値 | 高 | 中 | 高 |\n| 技術リスク | 中 | 低 | 低 |\n| 実装工数 | 大 | 中 | 小 |",
  },
  {
    key: "executionPlan",
    label: "実行計画",
    placeholder:
      "例:\n- Phase 1（1-6週）: A案の設計・実装\n- Phase 2（7-10週）: C案の実装（A案と並行テスト）\n- Phase 3（11-12週）: QA・リリース\n- 成功指標: 検索離脱率20%以上改善",
  },
];

export function BusinessExecutionForm({
  value,
  onChange,
  disabled,
}: BusinessExecutionFormProps) {
  const handleChange = (key: keyof BusinessExecutionFormData, v: string) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">意思決定ログ</h3>
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            {field.label}
            <span className="ml-1 text-red-500">*</span>
          </label>
          <textarea
            value={value[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={disabled}
            rows={5}
            placeholder={field.placeholder}
            className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      ))}
    </div>
  );
}
