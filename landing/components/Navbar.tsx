"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { href: "#how-it-works", label: "使い方" },
  { href: "#features", label: "特徴" },
  { href: "#categories", label: "カテゴリ" },
  { href: "#pricing", label: "料金" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-beige-50/80 backdrop-blur-lg shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-bold">
            PJ
          </div>
          <div className="leading-tight">
            <span className="text-lg font-bold text-brown-900">PM Journey</span>
            <span className="block text-[10px] tracking-wider text-brown-800/60 font-medium">
              Product Leadership
            </span>
          </div>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brown-800/70 hover:text-orange-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-sm"
          >
            無料で始める
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-brown-800"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-beige-50/95 backdrop-blur-lg border-t border-beige-200 px-6 pb-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-3 text-sm font-medium text-brown-800/70 hover:text-orange-600"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#cta"
            className="mt-2 block rounded-full bg-orange-500 px-5 py-2.5 text-center text-sm font-semibold text-white"
            onClick={() => setMenuOpen(false)}
          >
            無料で始める
          </a>
        </div>
      )}
    </header>
  );
}
