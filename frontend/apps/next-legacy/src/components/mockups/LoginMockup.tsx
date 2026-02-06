"use client";

import { useState } from "react";

type LoginMockupProps = {
  description?: string;
};

export function LoginMockup({ description }: LoginMockupProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = (value: string) => {
    if (!value) return "メールアドレスを入力してください";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "有効なメールアドレスを入力してください";
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return "パスワードを入力してください";
    if (value.length < 8) return "パスワードは8文字以上で入力してください";
    return undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ログイン</h2>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.email ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上"
              className={`w-full px-3 py-2 border rounded-md text-sm pr-10 ${
                errors.password ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              {showPassword ? "隠す" : "表示"}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300"
            />
            ログイン状態を保持
          </label>
          <a href="#" className="text-sm text-blue-600 hover:underline">
            パスワードを忘れた方
          </a>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          ログイン
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          アカウントをお持ちでない方は{" "}
          <a href="#" className="text-blue-600 hover:underline">
            新規登録
          </a>
        </p>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-500">
        <p className="font-medium mb-1">仕様情報:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>メール: 有効なメール形式のみ</li>
          <li>パスワード: 8文字以上</li>
          <li>ログイン試行: 5回失敗で15分ロック</li>
        </ul>
      </div>
    </div>
  );
}
