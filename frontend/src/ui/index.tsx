import type { PropsWithChildren, ButtonHTMLAttributes } from "react";

export function SurfaceCard({ children }: PropsWithChildren) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}

export type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PillButton({ children, className = "", ...props }: PillButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
