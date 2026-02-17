import { useState } from "react";
import type { TestCase } from "@/types";

type TestCaseFormProps = {
  testCases: TestCase[];
  onAdd: (data: { name: string; preconditions: string; steps: string; expectedResult: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
};

export function TestCaseForm({ testCases, onAdd, onDelete, isLoading }: TestCaseFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    preconditions: "",
    steps: "",
    expectedResult: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.steps.trim() || !formData.expectedResult.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({
        name: formData.name.trim(),
        preconditions: formData.preconditions.trim(),
        steps: formData.steps.trim(),
        expectedResult: formData.expectedResult.trim(),
      });
      setFormData({ name: "", preconditions: "", steps: "", expectedResult: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">テストケース追加</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="tc-name" className="mb-1 block text-xs font-medium text-gray-700">
              テスト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tc-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例: ログイン成功時にダッシュボードへ遷移する"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="tc-preconditions" className="mb-1 block text-xs font-medium text-gray-700">
              前提条件
            </label>
            <textarea
              id="tc-preconditions"
              name="preconditions"
              value={formData.preconditions}
              onChange={handleChange}
              rows={2}
              placeholder="例: 有効なアカウントが存在する"
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="tc-steps" className="mb-1 block text-xs font-medium text-gray-700">
              手順 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="tc-steps"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              rows={3}
              placeholder="1. ログインページを開く&#10;2. メールアドレスを入力&#10;3. パスワードを入力&#10;4. ログインボタンをクリック"
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="tc-expected" className="mb-1 block text-xs font-medium text-gray-700">
              期待結果 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="tc-expected"
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              rows={2}
              placeholder="例: ダッシュボード画面が表示される"
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.name.trim() ||
              !formData.steps.trim() ||
              !formData.expectedResult.trim()
            }
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "追加中..." : "テストケースを追加"}
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">追加済みテストケース ({testCases.length})</h3>
        {isLoading ? (
          <p className="py-4 text-center text-sm text-gray-500">読み込み中...</p>
        ) : testCases.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">テストケースがありません。上のフォームから追加してください。</p>
        ) : (
          <div className="space-y-3">
            {testCases.map((testCase, index) => (
              <div key={testCase.id} className="rounded-md bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}. {testCase.name}
                    </p>
                    {testCase.preconditions && (
                      <p className="mt-1 text-xs text-gray-600">
                        <span className="font-medium">前提条件:</span> {testCase.preconditions}
                      </p>
                    )}
                    <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
                      <span className="font-medium">手順:</span> {testCase.steps}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      <span className="font-medium">期待結果:</span> {testCase.expectedResult}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(testCase.id)}
                    disabled={deletingId === testCase.id}
                    className="text-sm text-gray-400 transition hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === testCase.id ? "..." : "✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
