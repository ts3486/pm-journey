export type IncidentResponseFormData = {
  impactScope: string;
  initialResponse: string;
  stakeholderNotice: string;
  rootCausePrevention: string;
};

export function serializeIncidentResponseForm(data: IncidentResponseFormData): string {
  const sections = [
    `## 影響範囲の整理\n${data.impactScope}`,
    `## 初動対応方針\n${data.initialResponse}`,
    `## ステークホルダー連絡文\n${data.stakeholderNotice}`,
  ];
  if (data.rootCausePrevention.trim()) {
    sections.push(`## 原因分析と再発防止\n${data.rootCausePrevention}`);
  }
  return sections.join("\n\n");
}

type IncidentResponseFormProps = {
  value: IncidentResponseFormData;
  onChange: (value: IncidentResponseFormData) => void;
  disabled?: boolean;
};

const fields: {
  key: keyof IncidentResponseFormData;
  label: string;
  placeholder: string;
  required: boolean;
}[] = [
  {
    key: "impactScope",
    label: "影響範囲の整理",
    placeholder:
      "例:\n- 影響ユーザー: 全ユーザー約12万人\n- 影響機能: ログインAPI（500エラー）\n- 重大度: P1（サービス全体が利用不可）\n- 既存セッション: 影響なし",
    required: true,
  },
  {
    key: "initialResponse",
    label: "初動対応方針",
    placeholder:
      "例:\n1. SREチームにロールバック準備を依頼\n2. CS向けに障害告知テンプレートを準備\n3. 30分以内に暫定復旧を目指す",
    required: true,
  },
  {
    key: "stakeholderNotice",
    label: "ステークホルダー連絡文",
    placeholder:
      "例:\n【障害発生報告】\n発生時刻: 09:15\n事象: ログインAPIが応答不能\n影響範囲: 全ユーザー\n現在の対応: 原因調査中、ロールバック準備中\n次回報告: 30分後",
    required: true,
  },
  {
    key: "rootCausePrevention",
    label: "原因分析と再発防止（任意）",
    placeholder:
      "例:\n- 原因: DB接続プールの設定変更による枯渇\n- 再発防止: デプロイ前のstaging検証を必須化\n- フォローアップ: 監視アラートの閾値見直し",
    required: false,
  },
];

export function IncidentResponseForm({
  value,
  onChange,
  disabled,
}: IncidentResponseFormProps) {
  const handleChange = (key: keyof IncidentResponseFormData, v: string) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">障害対応レポート</h3>
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            {field.label}
            {field.required && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </label>
          <textarea
            value={value[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={disabled}
            rows={5}
            placeholder={field.placeholder}
            className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      ))}
    </div>
  );
}
