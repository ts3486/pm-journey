"use client";

import { useState } from "react";

type FormMockupProps = {
  description?: string;
};

export function FormMockup({ description }: FormMockupProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    message: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "お名前を入力してください";
    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }
    if (formData.phone && !/^[0-9-]{10,13}$/.test(formData.phone)) {
      newErrors.phone = "有効な電話番号を入力してください";
    }
    if (!formData.category) newErrors.category = "カテゴリを選択してください";
    if (!formData.message.trim()) {
      newErrors.message = "お問い合わせ内容を入力してください";
    } else if (formData.message.length < 10) {
      newErrors.message = "10文字以上で入力してください";
    } else if (formData.message.length > 1000) {
      newErrors.message = "1000文字以内で入力してください";
    }
    if (!formData.agreeTerms) newErrors.agreeTerms = "利用規約に同意してください";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setSubmitted(true);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">送信完了</h3>
        <p className="text-sm text-gray-500 mt-2">お問い合わせを受け付けました。</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({
              name: "",
              email: "",
              phone: "",
              category: "",
              message: "",
              agreeTerms: false,
            });
          }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          新しいお問い合わせ
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">お問い合わせフォーム</h2>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.name ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.email ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="090-1234-5678"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.phone ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.category ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">選択してください</option>
            <option value="product">製品について</option>
            <option value="support">サポート</option>
            <option value="billing">請求・お支払い</option>
            <option value="other">その他</option>
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md text-sm resize-none ${
              errors.message ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {errors.message ? (
              <p className="text-red-500">{errors.message}</p>
            ) : (
              <span>10〜1000文字</span>
            )}
            <span>{formData.message.length}/1000</span>
          </div>
        </div>

        <div>
          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-1 rounded border-gray-300"
            />
            <span>
              <a href="#" className="text-blue-600 hover:underline">
                利用規約
              </a>
              および
              <a href="#" className="text-blue-600 hover:underline">
                プライバシーポリシー
              </a>
              に同意します <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          送信する
        </button>
      </form>

      <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-500">
        <p className="font-medium mb-1">仕様情報:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>必須項目: 名前、メール、カテゴリ、内容、同意</li>
          <li>メール: 有効な形式のみ</li>
          <li>電話: 任意、10〜13桁の数字とハイフン</li>
          <li>内容: 10〜1000文字</li>
        </ul>
      </div>
    </div>
  );
}
