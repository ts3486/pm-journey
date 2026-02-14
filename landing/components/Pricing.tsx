const plans = [
  {
    name: "FREE",
    price: "¥0",
    period: "",
    desc: "個人での学習に最適",
    cta: "無料で始める",
    highlight: false,
    features: [
      "基礎シナリオへのアクセス",
      "AIエージェントとの対話",
      "4観点からの評価",
      "学習履歴の保存",
      "月5回までのシナリオ挑戦",
    ],
  },
  {
    name: "TEAM",
    price: "¥3,000",
    period: "/月〜",
    desc: "チームでの育成・管理に",
    cta: "チームプランを始める",
    highlight: true,
    features: [
      "FREEプランの全機能",
      "全シナリオへのアクセス",
      "無制限のシナリオ挑戦",
      "チームメンバー管理",
      "進捗ダッシュボード",
      "優先サポート",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white/40">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            <span className="text-orange-500">料金</span>プラン
          </h2>
          <p className="mt-3 text-brown-800/60">
            まずは無料で始めて、チームでの活用も
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all ${
                plan.highlight
                  ? "border-orange-500 bg-white shadow-lg shadow-orange-500/10"
                  : "border-beige-200 bg-white/70"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-bold text-white">
                  おすすめ
                </div>
              )}

              <div className="text-sm font-bold tracking-wider text-orange-500">
                {plan.name}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-brown-900">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-brown-800/60">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-brown-800/60">{plan.desc}</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-brown-800/80"
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      className="mt-0.5 shrink-0 text-orange-500"
                    >
                      <path
                        d="M4 9l4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#cta"
                className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                    : "border-2 border-brown-900/15 text-brown-900 hover:border-orange-500/40 hover:text-orange-600"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
