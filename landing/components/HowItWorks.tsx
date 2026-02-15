const steps = [
  {
    num: "01",
    title: "シナリオを選ぶ",
    desc: "レベルや興味に合わせて、実践的なPMシナリオを選択します。",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="20" height="20" rx="4" />
        <path d="M9 12h10M9 16h6" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "AIエージェントと対話",
    desc: "上司・同僚・顧客などの役割を持つAIと実践的な対話を行います。",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H9l-4 4V5a2 2 0 012-2h12a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "評価を受ける",
    desc: "4つの観点から詳細なフィードバックとスコアを受け取ります。",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "スキルアップ",
    desc: "繰り返し挑戦して、PMとしての判断力と対応力を高めます。",
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 12 10-12h-9l1-12z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            <span className="text-orange-500">4ステップ</span>で始める
          </h2>
          <p className="mt-3 text-brown-800/60">
            シンプルな流れで、実践的なPMスキルを身につけます
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`animate-fade-in-up animation-delay-${(i + 1) * 100} group relative rounded-2xl bg-white/70 border border-beige-200 p-6 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-orange-500/60 mb-1">
                STEP {step.num}
              </div>
              <h3 className="text-lg font-bold text-brown-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brown-800/60">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
