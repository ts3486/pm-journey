"use client";

import { scenarioCatalog, defaultScenario } from "@/config/scenarios";
import { storage } from "@/services/storage";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [savedByScenario, setSavedByScenario] = useState<Record<string, boolean>>({});
  const [lastScenarioId, setLastScenarioId] = useState<string | null>(null);

  useEffect(() => {
    const lastScenario = storage.loadLastScenarioId();
    setLastScenarioId(lastScenario);
    const map: Record<string, boolean> = {};
    scenarioCatalog.forEach((section) => {
      section.scenarios.forEach((scenario) => {
        map[scenario.id] = !!storage.loadLastSessionId(scenario.id);
      });
    });
    setSavedByScenario(map);
    setHasSavedSession(!!lastScenario);
  }, []);

  const defaultStartHref = `/scenario?scenarioId=${defaultScenario.id}&restart=1`;
  const resumeHref = lastScenarioId ? `/scenario?scenarioId=${lastScenarioId}` : defaultStartHref;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-500 px-8 py-10 text-white shadow-xl">
        <p className="text-sm uppercase tracking-wider">PM Journey</p>
        <h1 className="mt-3 text-3xl font-bold">AIと一緒に現場のPM/PMO体験を積む</h1>
        <p className="mt-3 max-w-2xl text-sm">
          シナリオを選んで仮想プロジェクトに参画。エージェント「鈴木」と対話しながら要件整理・リスク管理・評価まで進めましょう。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            href={defaultStartHref}
          >
            シミュレーション開始
          </Link>
          <Link
            className="rounded-lg border border-white/70 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
            href={resumeHref}
            aria-disabled={!hasSavedSession}
            onClick={(e) => {
              if (!hasSavedSession) {
                e.preventDefault();
              }
            }}
          >
            前回のセッションを再開
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">シナリオを選択</h2>
          <p className="text-sm text-gray-600">PM と PMO の2つの視点で練習できます。</p>
        </div>
        {scenarioCatalog.map((section) => (
          <div key={section.discipline} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {section.discipline}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              </div>
              <span className="text-xs uppercase tracking-wide text-indigo-600">新しいセッションを開始</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{scenario.discipline}</p>
                    <h4 className="text-lg font-semibold text-gray-900">{scenario.title}</h4>
                    <p className="text-sm text-gray-700">{scenario.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Link
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      href={`/scenario?scenarioId=${scenario.id}&restart=1`}
                    >
                      このシナリオで始める
                    </Link>
                    {savedByScenario[scenario.id] ? (
                      <Link
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        href={`/scenario?scenarioId=${scenario.id}`}
                      >
                        再開する
                      </Link>
                    ) : null}
                    <span className="text-xs text-gray-500">評価カテゴリ: 4分野 × 25%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">使い方</h2>
          <p className="text-base text-gray-700">
            PM/PMO として「鈴木」と対話し、要件やリスクを整理します。ホーム → シナリオ → 評価 → 履歴の流れで、
            オフラインでも進められるように設計されています。
          </p>
          <ol className="grid gap-4 text-base text-gray-800 md:grid-cols-3">
            <li className="rounded-xl border border-gray-100 bg-gray-50 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step 1</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">シナリオを選ぶ</p>
              <p className="mt-2 text-gray-700">
                PM と PMO の行を確認し、開始したいシナリオを選択。未保存時のみ開始ボタンが活性。
              </p>
            </li>
            <li className="rounded-xl border border-gray-100 bg-gray-50 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step 2</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">チャットしながら整理</p>
              <p className="mt-2 text-gray-700">
                自由入力で要件を固め、決定/リスク/前提/次の一手をタグ付け。進捗フラグで評価準備度を確認。
              </p>
            </li>
            <li className="rounded-xl border border-gray-100 bg-gray-50 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step 3</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">評価と振り返り</p>
              <p className="mt-2 text-gray-700">
                準備完了したら評価を実行（約10秒）。結果は履歴に保存され、Markdown/JSON でエクスポート可能。
              </p>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
