import { Suspense } from "react";
import Link from "next/link";
import { ProductConfigForm } from "@/components/settings";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
        <p className="text-sm">読み込み中...</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-orange-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            ホームに戻る
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">設定</h1>
          <p className="mt-2 text-slate-600">
            シナリオ全体で使用する設定を管理します
          </p>
        </div>

        {/* Product Config Form */}
        <Suspense fallback={<LoadingFallback />}>
          <ProductConfigForm />
        </Suspense>
      </div>
    </main>
  );
}

export const metadata = {
  title: "設定 | PM Journey",
  description: "PM Journeyの設定を管理します",
};
