export default function Footer() {
  return (
    <footer className="border-t border-beige-200 bg-white/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
              PJ
            </div>
            <div className="leading-tight">
              <span className="text-base font-bold text-brown-900">
                PM Journey
              </span>
              <span className="block text-[10px] tracking-wider text-brown-800/50 font-medium">
                Product Leadership
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm text-brown-800/60">
            <a href="#" className="hover:text-orange-600 transition-colors">
              利用規約
            </a>
            <a href="#" className="hover:text-orange-600 transition-colors">
              プライバシーポリシー
            </a>
            <a href="#" className="hover:text-orange-600 transition-colors">
              お問い合わせ
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-brown-800/40">
          &copy; {new Date().getFullYear()} PM Journey. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
