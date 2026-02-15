export default function CTASection() {
  return (
    <section id="cta" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-700 px-8 py-16 shadow-xl shadow-orange-500/20 md:px-16">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            今すぐ無料で始めましょう
          </h2>
          <p className="mt-4 text-base text-white/80 leading-relaxed">
            アカウント登録だけで、すぐにPMシナリオに挑戦できます。
            <br className="hidden sm:block" />
            AIエージェントと一緒に、実践的なスキルを磨きましょう。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-orange-600 shadow-sm hover:bg-beige-50 transition-colors"
            >
              無料で始める
            </a>
            <a
              href="#"
              className="rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              お問い合わせ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
