export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-8 py-10 text-white shadow-xl">
        <p className="text-sm uppercase tracking-wider">PM Journey</p>
        <h1 className="mt-3 text-3xl font-bold">AIと一緒に現場のPM体験を積む</h1>
        <p className="mt-3 max-w-2xl text-sm">
          PMとして仮想プロジェクトに参画し、エージェントと対話しながらPMに必要な業務をこなしましょう。完了後、AIによる評価とフィードバックも得られます！
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            href="/scenario"
          >
            シミュレーション開始
          </a>
          <a
            className="rounded-lg border border-white/70 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            href="/scenario"
          >
            前回のセッションを再開
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">使い方</h2>
          <p className="text-base text-gray-700">
            PM として「鈴木」と対話し、勤怠アプリの要件をまとめます。ホーム→シナリオ→評価→履歴の流れで、
            オフラインでも進められるように設計されています。
          </p>
          <ol className="grid gap-4 text-base text-gray-800 md:grid-cols-3">
            <li className="rounded-xl border border-gray-100 bg-gray-50 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step 1</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">始める / 再開する</p>
              <p className="mt-2 text-gray-700">
                ホームで「Start simulation」または「Resume last session」を選択。未保存時のみ開始ボタンが活性。
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
