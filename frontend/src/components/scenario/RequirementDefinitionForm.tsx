type RequirementDefinitionFormProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RequirementDefinitionForm({
  value,
  onChange,
  disabled,
}: RequirementDefinitionFormProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">要件定義書</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={16}
        placeholder={"例:\n## 目的・背景\nユーザーが安全にログインできる仕組みを提供し、不正アクセスを防止する\n\n## 機能要件\n- メールアドレスとパスワードでログインできる\n- パスワードは8文字以上で英数字を含む\n\n## 受入条件\n- 正しい認証情報でログインするとダッシュボードに遷移する\n- 3回連続でログイン失敗するとアカウントがロックされる"}
        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
