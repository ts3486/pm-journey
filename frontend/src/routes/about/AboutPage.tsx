import { Link } from "react-router-dom";
import { CSSProperties } from "react";

const revealDelay = (delay: number): CSSProperties => ({ "--delay": `${delay}ms` } as CSSProperties);

export function AboutPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section
        className="card relative overflow-hidden border-orange-200/70 bg-gradient-to-br from-orange-50/80 via-white/92 to-sky-50/70 p-6 reveal sm:p-8"
        style={revealDelay(0)}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-200/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative space-y-3">
          <p className="bg-gradient-to-r from-orange-700 via-sky-700 to-emerald-700 bg-clip-text text-xs font-semibold uppercase tracking-[0.28em] text-transparent">
            About PM Journey
          </p>
          <h1 className="font-display text-2xl text-slate-900 sm:text-3xl">PM Journeyとは？</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            AIエージェントのサポートを受けながら、実践的なタスクでプロダクトマネジメントスキルを鍛えるプラットフォーム
          </p>
        </div>
      </section>

      {/* Section 1: Overview */}
      <section className="card space-y-4 p-5 reveal sm:p-6" style={revealDelay(100)}>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-700/85">Overview</p>
          <h2 className="font-display text-xl text-slate-900">PM Journeyの概要</h2>
        </div>

        <p className="text-sm leading-relaxed text-slate-700">
          PM Journeyは、プロダクトマネージャー（PdM）に必要なスキルを実践的に学べるプラットフォームです。
          実際のPM業務で直面するシナリオに基づいたタスクに取り組み、AIエージェントのサポートを受けながら課題を進め、AIによる評価とフィードバックで効率的にスキルを伸ばせます。
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "対象ユーザー",
              description: "PM初心者〜中級者、PMを目指すエンジニアやデザイナー、PM組織のスキル底上げを図るリーダー",
            },
            {
              title: "実践的なタスク",
              description: "合意形成、要件定義、障害対応など、実務に直結するテーマのタスクにAIエージェントと一緒に取り組む",
            },
            {
              title: "AI評価",
              description: "タスク完了後にAIがあなたの成果を多角的に評価し、具体的な改善ポイントをフィードバック",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-orange-200/70 bg-orange-50/50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Learning Flow */}
      <section className="card space-y-4 p-5 reveal sm:p-6" style={revealDelay(200)}>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/85">How It Works</p>
          <h2 className="font-display text-xl text-slate-900">学習の流れ</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: 1,
              title: "シナリオを選ぶ",
              description: "ロードマップから自分のレベルに合ったシナリオを選択。基礎から応用まで段階的に取り組めます。",
              color: "border-orange-300/80 bg-orange-100 text-orange-700",
              cardColor: "border-orange-200/70 bg-gradient-to-br from-orange-50/60 via-white/90 to-amber-50/60",
            },
            {
              step: 2,
              title: "AIエージェントとタスクに取り組む",
              description: "AIエージェントのサポートを受けながら、PM業務に基づいたタスクを実践。リアルな状況判断力を養います。",
              color: "border-sky-300/80 bg-sky-100 text-sky-700",
              cardColor: "border-sky-200/70 bg-gradient-to-br from-sky-50/60 via-white/90 to-cyan-50/60",
            },
            {
              step: 3,
              title: "AI評価とフィードバック",
              description: "タスク完了後、AIが成果物を評価し改善ポイントを具体的にフィードバック。次の挑戦に活かせます。",
              color: "border-emerald-300/80 bg-emerald-100 text-emerald-700",
              cardColor: "border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-white/90 to-teal-50/60",
            },
          ].map((item) => (
            <div
              key={item.step}
              className={`relative rounded-xl border px-4 pb-4 pt-8 ${item.cardColor}`}
            >
              <div
                className={`absolute -top-3 left-4 flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold shadow-sm ${item.color}`}
              >
                {item.step}
              </div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Learning Categories */}
      <section className="card space-y-4 p-5 reveal sm:p-6" style={revealDelay(300)}>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-700/85">Categories</p>
          <h2 className="font-display text-xl text-slate-900">学習カテゴリ</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "基礎ソフトスキル",
              subtitle: "合意形成・交渉",
              description: "ステークホルダーとの合意形成や交渉スキルを実践的に学びます。",
              pill: "bg-orange-50 text-orange-700 border-orange-200/70",
            },
            {
              title: "テスト設計",
              subtitle: "品質保証の視点",
              description: "テストケース作成やQA視点での品質保証スキルを身につけます。",
              pill: "bg-sky-50 text-sky-700 border-sky-200/70",
            },
            {
              title: "要件定義",
              subtitle: "仕様化・優先順位",
              description: "要件を整理し、優先順位をつけて仕様に落とし込む力を鍛えます。",
              pill: "bg-rose-50 text-rose-700 border-rose-200/70",
            },
            {
              title: "障害対応",
              subtitle: "危機管理",
              description: "本番障害やインシデント発生時の判断力・対応力を養います。",
              pill: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
            },
            {
              title: "事業推進",
              subtitle: "戦略的思考",
              description: "事業計画の策定やステークホルダーへの説明力を磨きます。",
              pill: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
            },
          ].map((category) => (
            <div
              key={category.title}
              className={`rounded-xl border px-4 py-3 ${category.pill}`}
            >
              <p className="text-sm font-semibold">{category.title}</p>
              <p className="text-[11px] font-medium opacity-75">{category.subtitle}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Features */}
      <section className="card space-y-4 p-5 reveal sm:p-6" style={revealDelay(400)}>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/85">Features</p>
          <h2 className="font-display text-xl text-slate-900">特徴</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: "AIエージェントによるサポート",
              description: "タスク中はAIエージェントがあなたの相談相手となり、的確なアドバイスを提供します。",
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              ),
              title: "段階的な学習ロードマップ",
              description: "基礎から応用へ、カテゴリ順に進めることでスキルを体系的に習得できます。",
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14M9 3v2a3 3 0 003 3m0 0a3 3 0 003-3V3m-3 5v4m-4 0h8m-8 0a4 4 0 00-4 4h16a4 4 0 00-4-4m-8 0V8" />
                </svg>
              ),
              title: "実績・修了証システム",
              description: "学習の成果を実績として記録。全シナリオ合格で修了証を発行します。",
            },
            {
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: "チーム学習対応",
              description: "チームメンバーの学習進捗を管理し、組織全体のPMスキル向上を支援します。",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex gap-3 rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                {feature.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="card flex flex-col items-center gap-4 border-orange-200/70 bg-gradient-to-r from-orange-50/80 via-white/90 to-amber-50/80 p-6 text-center reveal sm:p-8"
        style={revealDelay(500)}
      >
        <h2 className="font-display text-xl text-slate-900">さっそく始めてみましょう</h2>
        <p className="max-w-lg text-sm text-slate-600">
          ロードマップからあなたに合ったシナリオを選んで、PMスキルの学習をスタートしましょう。
        </p>
        <Link to="/" className="btn-primary">
          ロードマップを見る
        </Link>
      </section>
    </div>
  );
}
