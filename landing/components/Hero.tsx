export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Decorative blurred circles */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-48 -left-24 h-72 w-72 rounded-full bg-beige-300/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Left: copy */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              AIと一緒に
              <br />
              <span className="text-orange-500">PM体験</span>を積む
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-brown-800/70">
              リアルなプロダクトマネジメントのシナリオをAIエージェントとの対話で体験。
              実践的なスキルを安全な環境で磨きましょう。
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#cta"
                className="rounded-full bg-orange-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-colors"
              >
                無料で始める
              </a>
              <a
                href="#how-it-works"
                className="rounded-full border-2 border-brown-900/15 px-7 py-3 text-base font-semibold text-brown-900 hover:border-orange-500/40 hover:text-orange-600 transition-colors"
              >
                詳しく見る
              </a>
            </div>
          </div>

          {/* Right: mock chat UI */}
          <div className="animate-fade-in-up animation-delay-200">
            <div className="mx-auto max-w-sm rounded-2xl border border-beige-200 bg-white/80 shadow-xl shadow-brown-900/5 backdrop-blur-sm overflow-hidden">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-beige-200 bg-beige-100/60 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600 text-xs font-bold">
                  AI
                </div>
                <div>
                  <div className="text-sm font-semibold text-brown-900">
                    PMコーチ
                  </div>
                  <div className="text-[11px] text-brown-800/50">
                    AIエージェント
                  </div>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-3 p-5">
                <div className="rounded-2xl rounded-tl-md bg-beige-100 px-4 py-2.5 text-sm text-brown-800 max-w-[85%]">
                  プロダクトの優先順位付けについて、ステークホルダーから相反する要望が来ています。どう対応しますか？
                </div>
                <div className="ml-auto rounded-2xl rounded-tr-md bg-orange-500 px-4 py-2.5 text-sm text-white max-w-[85%]">
                  まずは各ステークホルダーの目的を整理して、データに基づいた判断基準を提案します。
                </div>
                <div className="rounded-2xl rounded-tl-md bg-beige-100 px-4 py-2.5 text-sm text-brown-800 max-w-[85%]">
                  良いアプローチですね！具体的にどのようなフレームワークを使いますか？
                </div>
              </div>

              {/* Input bar */}
              <div className="border-t border-beige-200 px-4 py-3">
                <div className="flex items-center gap-2 rounded-full bg-beige-100/80 px-4 py-2">
                  <span className="text-sm text-brown-800/40 flex-1">
                    メッセージを入力...
                  </span>
                  <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 7h10M8 3l4 4-4 4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
