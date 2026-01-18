export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-8 py-10 text-white shadow-xl">
        <p className="text-sm uppercase tracking-wider">Olivia PM Simulation</p>
        <h1 className="mt-3 text-3xl font-bold">社内勤怠アプリのPMシミュレーションをWebで</h1>
        <p className="mt-3 max-w-2xl text-sm">
          Slack なしで、PM として「鈴木」と対話しながら要件をまとめ、評価を受け取ります。モバイル利用性向上と打刻漏れ削減を目標に、6ヶ月以内のデプロイを想定。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            href="/scenario"
          >
            Start simulation
          </a>
          <a
            className="rounded-lg border border-white/70 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            href="/scenario"
          >
            Resume last session
          </a>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>役割: あなた=PM、AI「鈴木」=エンジニア/デザイナー</li>
            <li>フロー: 自由入力のチャット、必要に応じて評価</li>
            <li>時間目安: 20-30 分</li>
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Scenario snapshot</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>目標: 打刻漏れ削減、モバイルアクセス改善</li>
            <li>対象: 内部社員/マネージャー</li>
            <li>評価カテゴリ: 方針提示/計画/コラボ/リスク管理 (各25%)</li>
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
          <p className="mt-2 text-sm text-gray-700">
            最新セッションのスコアやステータスを履歴で確認できます。
          </p>
          <a className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline" href="/history">
            View history
          </a>
        </div>
      </section>
    </div>
  );
}
