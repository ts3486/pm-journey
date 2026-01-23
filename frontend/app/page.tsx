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
    <div className="space-y-12">
      <section
        className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] -mt-8 border-b border-blue-700/70 bg-blue-700 py-14 shadow-[inset_0_-1px_0_rgba(30,64,175,0.34)] reveal lg:-mt-12"
        style={revealDelay(0)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.18),rgba(15,23,42,0))]" />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">PM Journey</p>
            <h1 className="font-display text-3xl text-white md:text-4xl">
              AIと一緒にPM体験を積む
            </h1>
            <p className="max-w-2xl text-sm text-white/80 md:text-base">
              シナリオを選んで仮想プロジェクトに参画。エージェントと対話しながら、実践的な意思決定・リスク整理・合意形成を磨けます。
            </p>
            {lastScenario ? (
              <div className="text-xs text-white/70">Last session: {lastScenario.title}</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-6 reveal" style={revealDelay(120)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Scenarios</p>
            <h2 className="font-display text-2xl text-slate-900">シナリオを選択</h2>
            <p className="mt-2 text-sm text-slate-600">基礎とチャレンジ、2つのレベルで練習できます。</p>
          </div>
        </div>

        {scenarioCatalog.map((section, sectionIndex) => (
          <div key={section.discipline} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="badge">{section.title}</span>
                <h3 className="font-display text-lg text-slate-900">{section.title}</h3>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.scenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className="card flex flex-col justify-between p-5 reveal"
                  style={revealDelay(160 + sectionIndex * 80 + index * 60)}
                >
                  <div className="space-y-3">
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

    </div>
  );
}
