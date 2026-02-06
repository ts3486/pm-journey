"use client";

import { useEffect, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatStream } from "@/components/ChatStream";
import { TestCaseForm } from "@/components/TestCaseForm";
import { LoginMockup, FormMockup, FileUploadMockup } from "@/components/mockups";
import { api } from "@/services/api";
import type { Scenario, TestCase } from "@pm-journey/types";
import type { SessionState } from "@/services/sessions";

type TestCaseScenarioLayoutProps = {
  scenario: Scenario;
  state: SessionState | null;
  awaitingReply: boolean;
  onSend: (content: string) => void;
  onComplete: () => void;
  onReset: () => void;
};

export function TestCaseScenarioLayout({
  scenario,
  state,
  awaitingReply,
  onSend,
  onComplete,
  onReset,
}: TestCaseScenarioLayoutProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);
  const hasActive = !!state?.session;
  const mockupComponent = scenario.featureMockup?.component;

  useEffect(() => {
    if (state?.session?.id) {
      setIsLoadingTestCases(true);
      api
        .listTestCases(state.session.id)
        .then((cases) => setTestCases(cases))
        .catch(console.error)
        .finally(() => setIsLoadingTestCases(false));
    }
  }, [state?.session?.id]);

  const handleAddTestCase = async (data: {
    name: string;
    preconditions: string;
    steps: string;
    expectedResult: string;
  }) => {
    if (!state?.session?.id) return;
    const created = await api.createTestCase(state.session.id, data);
    setTestCases((prev) => [...prev, created]);
  };

  const handleDeleteTestCase = async (id: string) => {
    await api.deleteTestCase(id);
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const renderMockup = () => {
    const description = scenario.featureMockup?.description;
    switch (mockupComponent) {
      case "login":
        return <LoginMockup description={description} />;
      case "form":
        return <FormMockup description={description} />;
      case "file-upload":
        return <FileUploadMockup description={description} />;
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
            デザインが設定されていません
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                TEST CASE Scenario
              </p>
              <h1 className="font-display text-2xl text-slate-900">{scenario.title}</h1>
              <p className="max-w-2xl text-sm text-slate-600">{scenario.description}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">機能デザイン</h3>
        <div className="p-4">{renderMockup()}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <TestCaseForm
              testCases={testCases}
              onAdd={handleAddTestCase}
              onDelete={handleDeleteTestCase}
              isLoading={isLoadingTestCases}
            />
          </div>

          {/* 完了ボタン - テストケースフォームの下に配置 */}
          {hasActive && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">
                {testCases.length === 0
                  ? "テストケースを追加してから提出してください"
                  : `${testCases.length}件のテストケースを作成しました`}
              </p>
              <button
                type="button"
                className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onComplete}
                disabled={testCases.length === 0}
              >
                テストケースを提出する
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <ChatStream messages={state?.messages ?? []} maxHeight="40vh" isTyping={awaitingReply} />
          <ChatComposer
            onSend={onSend}
            disabled={!hasActive}
            quickPrompts={[
              "テスト観点を洗い出してください",
              "境界値テストについて教えてください",
              "異常系のテストケースを考えてください",
            ]}
          />

          {hasActive && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-slate-400 transition hover:text-slate-600"
                onClick={onReset}
              >
                セッションをリセット
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
