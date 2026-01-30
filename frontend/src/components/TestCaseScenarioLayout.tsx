"use client";

import { useEffect, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatStream } from "@/components/ChatStream";
import { TestCaseForm } from "@/components/TestCaseForm";
import { LoginMockup, FormMockup, FileUploadMockup } from "@/components/mockups";
import { api } from "@/services/api";
import type { Scenario, TestCase } from "@/types/session";
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
            モックアップが設定されていません
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">機能モックアップ</h3>
            <div className="overflow-auto max-h-[60vh]">{renderMockup()}</div>
          </div>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card p-4">
          <TestCaseForm
            testCases={testCases}
            onAdd={handleAddTestCase}
            onDelete={handleDeleteTestCase}
            isLoading={isLoadingTestCases}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">仕様・背景情報</h3>
            <div className="text-xs text-slate-700 space-y-2">
              {scenario.product.summary && (
                <p>
                  <span className="font-semibold">概要:</span> {scenario.product.summary}
                </p>
              )}
              {scenario.product.constraints?.length > 0 && (
                <div>
                  <p className="font-semibold">制約:</p>
                  <ul className="ml-4 list-disc">
                    {scenario.product.constraints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {scenario.supplementalInfo && (
                <div>
                  <p className="font-semibold">補足:</p>
                  <p className="whitespace-pre-wrap">{scenario.supplementalInfo}</p>
                </div>
              )}
            </div>
          </div>

          {testCases.length >= 3 && (
            <div className="card-muted px-4 py-4 text-sm text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">テストケース作成完了</p>
                  <p className="text-xs text-slate-600">{testCases.length}件のテストケースを作成しました</p>
                </div>
                <button type="button" className="btn-primary" onClick={onComplete}>
                  評価を受ける
                </button>
              </div>
            </div>
          )}

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
