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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setSubmitted(true);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
          ✓
        </div>
        <h3 className="text-lg font-semibold text-gray-900">送信完了</h3>
        <p className="mt-2 text-sm text-gray-500">お問い合わせを受け付けました。</p>
        <button
          type="button"
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
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">お問い合わせフォーム</h2>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="form-name" className="mb-1 block text-sm font-medium text-gray-700">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="form-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.name ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="form-email" className="mb-1 block text-sm font-medium text-gray-700">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="form-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.email ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="form-phone" className="mb-1 block text-sm font-medium text-gray-700">
            電話番号
          </label>
          <input
            type="tel"
            id="form-phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="090-1234-5678"
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.phone ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="form-category" className="mb-1 block text-sm font-medium text-gray-700">
            カテゴリ <span className="text-red-500">*</span>
          </label>
          <select
            id="form-category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              errors.category ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">選択してください</option>
            <option value="product">製品について</option>
            <option value="support">サポート</option>
            <option value="billing">請求・お支払い</option>
            <option value="other">その他</option>
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
        </div>

        <div>
          <label htmlFor="form-message" className="mb-1 block text-sm font-medium text-gray-700">
            お問い合わせ内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="form-message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={`w-full resize-none rounded-md border px-3 py-2 text-sm ${
              errors.message ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            {errors.message ? <p className="text-red-500">{errors.message}</p> : <span>10〜1000文字</span>}
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
          {errors.agreeTerms && <p className="mt-1 text-xs text-red-500">{errors.agreeTerms}</p>}
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          送信する
        </button>
      </form>

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium">仕様情報:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>必須項目: 名前、メール、カテゴリ、内容、同意</li>
          <li>メール: 有効な形式のみ</li>
          <li>電話: 任意、10〜13桁の数字とハイフン</li>
          <li>内容: 10〜1000文字</li>
        </ul>
      </div>
    </div>
  );
}
