import { Link } from "react-router-dom";
import type { CSSProperties } from "react";

const revealDelay = (delay: number): CSSProperties => ({ "--delay": `${delay}ms` } as CSSProperties);

type HomeHeroBannerProps = {
  startHref: string;
  totalScenarios: number;
};

export function HomeHeroBanner({ startHref, totalScenarios }: HomeHeroBannerProps) {
  return (
    <section
      className="hero relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] -mt-8 py-16 reveal lg:-mt-12 lg:py-20"
      style={revealDelay(0)}
    >
      <div className="pointer-events-none absolute -left-10 top-10 h-28 w-28 rounded-full border border-white/70 bg-white/40 blur-[1px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-44 w-44 rounded-full border border-white/60 bg-white/30 blur-[2px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.38em] text-orange-700 shadow-[0_10px_24px_rgba(176,95,35,0.22)]">
              PM Journey
            </span>
            <h1 className="font-display text-3xl text-[#3b2314] md:text-4xl lg:text-5xl">AIと一緒にPM体験を積む</h1>
            <p className="max-w-xl text-sm text-[#5f4b3c] md:text-base">
              シナリオを選んで仮想プロジェクトに参画。エージェントと対話しながら、意思決定・リスク整理・合意形成を実践できます。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary" to={startHref}>
                シナリオを開始する
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="badge-accent">全{totalScenarios}シナリオ</span>
              <span className="badge">対話ベース</span>
              <span className="badge">15分から</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="hero-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700/80">Scenario</p>
                  <h2 className="mt-2 text-lg font-semibold text-[#3b2314]">エージェントとPMシナリオを体験</h2>
                </div>
                <span className="badge-accent">Demo</span>
              </div>
              <div className="relative mt-4 space-y-3 overflow-hidden rounded-2xl border border-orange-200/70 bg-white/80 p-4 shadow-[0_16px_30px_rgba(120,71,34,0.12)]">
                <div
                  className="pointer-events-none absolute -right-8 top-8 h-28 w-28 rounded-full bg-orange-200/60 blur-2xl"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/60 blur-2xl"
                  aria-hidden="true"
                />
                <div className="flex justify-start">
                  <div
                    className="max-w-[80%] rounded-2xl border border-orange-100/70 bg-[#fff7ec] px-4 pb-3 pt-1.5 shadow-sm reveal"
                    style={revealDelay(220)}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-700/70">Agent</span>
                    <p className="text-xs text-slate-800">山田さんよろしくお願いします！自己紹介お願いできますか？</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="max-w-[75%] rounded-2xl border border-orange-200/70 bg-white px-4 pb-3 pt-1.5 shadow-sm reveal"
                    style={revealDelay(340)}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">You</span>
                    <p className="text-xs  text-slate-800">よろしくお願いします！今回PMとして参画させて頂く山田です。</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div
                    className="max-w-[85%] rounded-2xl border border-orange-100/70 bg-[#fff7ec] px-4 pb-3 pt-1.5 shadow-sm reveal"
                    style={revealDelay(460)}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-700/70">Agent</span>
                    <p className="text-xs  text-slate-800">ありがとうございます！では早速、このプロジェクトのPMとしてタスクを依頼させてください。</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="uppercase tracking-[0.3em] text-orange-700/70">Flow</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  <span className="h-2 w-2 rounded-full bg-orange-200" />
                  <span className="h-2 w-2 rounded-full bg-orange-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
