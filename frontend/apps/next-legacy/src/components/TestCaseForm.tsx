"use client";

import { useState } from "react";
import type { TestCase } from "@pm-journey/types";

type TestCaseFormProps = {
  testCases: TestCase[];
  onAdd: (data: {
    name: string;
    preconditions: string;
    steps: string;
    expectedResult: string;
  }) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">テストケース追加</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="tc-name" className="block text-xs font-medium text-gray-700 mb-1">
              テスト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="tc-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例: ログイン成功時にダッシュボードへ遷移する"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="tc-preconditions"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              前提条件
            </label>
            <textarea
              id="tc-preconditions"
              name="preconditions"
              value={formData.preconditions}
              onChange={handleChange}
              rows={2}
              placeholder="例: 有効なアカウントが存在する"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="tc-steps" className="block text-xs font-medium text-gray-700 mb-1">
              手順 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="tc-steps"
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              rows={3}
              placeholder="1. ログインページを開く&#10;2. メールアドレスを入力&#10;3. パスワードを入力&#10;4. ログインボタンをクリック"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="tc-expected"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              期待結果 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="tc-expected"
              name="expectedResult"
              value={formData.expectedResult}
              onChange={handleChange}
              rows={2}
              placeholder="例: ダッシュボード画面が表示される"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "追加中..." : "テストケースを追加"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          追加済みテストケース ({testCases.length})
        </h3>
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-4">読み込み中...</p>
        ) : testCases.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            テストケースがありません。上のフォームから追加してください。
          </p>
        ) : (
          <div className="space-y-3">
            {testCases.map((tc, index) => (
              <div key={tc.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}. {tc.name}
                    </p>
                    {tc.preconditions && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">前提条件:</span> {tc.preconditions}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                      <span className="font-medium">手順:</span> {tc.steps}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">期待結果:</span> {tc.expectedResult}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(tc.id)}
                    disabled={deletingId === tc.id}
                    className="text-gray-400 hover:text-red-500 text-sm shrink-0 disabled:opacity-50"
                  >
                    {deletingId === tc.id ? "..." : "✕"}
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
