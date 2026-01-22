"use client";

import { defaultScenario, getScenarioById, scenarioCatalog } from "@/config/scenarios";
import { storage } from "@/services/storage";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

const revealDelay = (delay: number): CSSProperties => ({ "--delay": `${delay}ms` } as CSSProperties);

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
  const lastScenario = useMemo(() => getScenarioById(lastScenarioId), [lastScenarioId]);

  return (
    <div className="space-y-16">
      <section className="card relative overflow-hidden px-8 py-12 reveal" style={revealDelay(0)}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-100/80 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-sky-100/80 blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">PM Journey</p>
            <h1 className="font-display text-3xl text-slate-900 md:text-4xl">
              AIと一緒に基礎〜チャレンジのPM体験を積む
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              シナリオを選んで仮想プロジェクトに参画。エージェント「鈴木」と対話しながら、実践的な意思決定・リスク整理・合意形成を磨けます。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href={defaultStartHref}>
              シミュレーション開始
            </Link>
            <Link
              className={`btn-secondary ${hasSavedSession ? "" : "pointer-events-none opacity-50"}`}
              href={resumeHref}
              aria-disabled={!hasSavedSession}
              tabIndex={hasSavedSession ? 0 : -1}
            >
              前回のセッションを再開
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="card-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Focus</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">意思決定と合意形成</p>
              <p className="mt-1 text-xs text-slate-600">PM視点での整理・伝達・合意を練習。</p>
            </div>
            <div className="card-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workflow</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">チャット → ミッション → 評価</p>
              <p className="mt-1 text-xs text-slate-600">ゴール達成で自動評価、履歴に保存。</p>
            </div>
            <div className="card-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mode</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">オフライン対応</p>
              <p className="mt-1 text-xs text-slate-600">接続が戻れば評価と同期を再開。</p>
            </div>
          </div>
          {lastScenario ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="badge">Last session</span>
              <span className="text-slate-600">{lastScenario.title}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-6 reveal" style={revealDelay(120)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Scenarios</p>
            <h2 className="font-display text-2xl text-slate-900">シナリオを選択</h2>
            <p className="mt-2 text-sm text-slate-600">基礎とチャレンジ、2つのレベルで練習できます。</p>
          </div>
          <div className="text-xs text-slate-500">保存済みのシナリオは再開ボタンが有効です。</div>
        </div>

        {scenarioCatalog.map((section, sectionIndex) => (
          <div key={section.discipline} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="badge">{section.title}</span>
                <h3 className="font-display text-lg text-slate-900">{section.title}</h3>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Sessions</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.scenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className="card flex flex-col justify-between p-5 reveal"
                  style={revealDelay(160 + sectionIndex * 80 + index * 60)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge">{scenario.discipline}</span>
                      {savedByScenario[scenario.id] ? <span className="badge-accent">Saved</span> : null}
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">{scenario.title}</h4>
                    <p className="text-sm text-slate-600">{scenario.description}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Link className="btn-primary" href={`/scenario?scenarioId=${scenario.id}&restart=1`}>
                      このシナリオを始める
                    </Link>
                    {savedByScenario[scenario.id] ? (
                      <Link className="btn-secondary" href={`/scenario?scenarioId=${scenario.id}`}>
                        再開する
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card px-6 py-8 reveal" style={revealDelay(240)}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">How it works</p>
            <h2 className="font-display text-2xl text-slate-900">使い方</h2>
          </div>
          <p className="text-base text-slate-600">
            基礎/チャレンジシナリオで「鈴木」と対話し、要件やリスクを整理します。ホーム → シナリオ → 評価 → 履歴の流れで、
            オフラインでも進められるように設計されています。
          </p>
          <ol className="grid gap-4 text-base text-slate-800 md:grid-cols-3">
            {[
              {
                step: "Step 1",
                title: "シナリオを選ぶ",
                body: "基礎とチャレンジの行を確認し、開始したいシナリオを選択。未保存時のみ開始ボタンが活性。",
              },
              {
                step: "Step 2",
                title: "チャットしながら整理",
                body: "自由入力で要件を固め、決定/リスク/前提/次の一手をタグ付け。進捗フラグで評価準備度を確認。",
              },
              {
                step: "Step 3",
                title: "評価と振り返り",
                body: "準備完了したら評価を実行（約10秒）。結果は履歴に保存され、Markdown/JSON でエクスポート可能。",
              },
            ].map((item, index) => (
              <li key={item.step} className="card-muted p-5 reveal" style={revealDelay(280 + index * 80)}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">{item.step}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-slate-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
