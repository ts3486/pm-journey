import { useState } from "react";

type PasswordResetMockupProps = {
  description?: string;
};

export function PasswordResetMockup({ description }: PasswordResetMockupProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "done">("request");
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRequest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateEmail(email)) {
      setError("有効なメールアドレスを入力してください");
      return;
    }
    setError(null);
    setStep("verify");
  };

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("確認コードを入力してください");
      return;
    }
    if (newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("確認用パスワードが一致しません");
      return;
    }
    setError(null);
    setStep("done");
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">パスワード再設定</h2>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}

      {step === "request" ? (
        <form onSubmit={handleRequest} className="mt-5 space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            リセットメールを送信
          </button>
        </form>
      ) : null}

      {step === "verify" ? (
        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label htmlFor="reset-code" className="mb-1 block text-sm font-medium text-gray-700">
              確認コード
            </label>
            <input
              id="reset-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="reset-new-password" className="mb-1 block text-sm font-medium text-gray-700">
              新しいパスワード
            </label>
            <input
              id="reset-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="reset-confirm-password" className="mb-1 block text-sm font-medium text-gray-700">
              確認用パスワード
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            パスワードを更新
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="mt-5 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          パスワードを更新しました。再度ログインしてください。
        </div>
      ) : null}

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium">仕様情報:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>メールアドレス入力で再設定メール送信</li>
          <li>確認コードは10分有効</li>
          <li>新しいパスワードは8文字以上</li>
          <li>3回失敗でコードを無効化</li>
        </ul>
      </div>
    </div>
  );
}
