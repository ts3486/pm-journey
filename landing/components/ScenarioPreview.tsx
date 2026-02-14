const categories = [
  {
    name: "基礎ソフトスキル",
    color: "bg-orange-500",
    lightColor: "bg-orange-500/10",
    textColor: "text-orange-600",
    scenarios: ["効果的な1on1ミーティング", "チーム内コンフリクト解決"],
  },
  {
    name: "テストケース作成",
    color: "bg-sky-500",
    lightColor: "bg-sky-500/10",
    textColor: "text-sky-600",
    scenarios: ["QAプロセスの設計", "リグレッションテスト計画"],
  },
  {
    name: "要件定義",
    color: "bg-rose-500",
    lightColor: "bg-rose-500/10",
    textColor: "text-rose-600",
    scenarios: ["PRD作成と合意形成", "ユーザーストーリーマッピング"],
  },
  {
    name: "障害対応",
    color: "bg-emerald-500",
    lightColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
    scenarios: ["本番障害のトリアージ", "ポストモーテム運営"],
  },
  {
    name: "事業推進",
    color: "bg-indigo-500",
    lightColor: "bg-indigo-500/10",
    textColor: "text-indigo-600",
    scenarios: ["新機能のGo/No-Go判断", "OKR設定とレビュー"],
  },
];

export default function ScenarioPreview() {
  return (
    <section id="categories" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            <span className="text-orange-500">学習カテゴリ</span>
          </h2>
          <p className="mt-3 text-brown-800/60">
            PMに必要なスキルを5つのカテゴリで体系的に学べます
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="group rounded-2xl border border-beige-200 bg-white/70 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-3 w-3 rounded-full ${cat.color}`}
                />
                <h3 className="text-base font-bold text-brown-900">
                  {cat.name}
                </h3>
              </div>
              <ul className="space-y-2">
                {cat.scenarios.map((s) => (
                  <li
                    key={s}
                    className={`flex items-center gap-2 rounded-lg ${cat.lightColor} px-3 py-2 text-sm ${cat.textColor} font-medium`}
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 7h10M8 3l4 4-4 4" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
