import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type FeatureGateProps = {
  allowed: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  ctaLabel?: string;
  ctaTo?: string;
};

export function FeatureGate({
  allowed,
  title,
  description,
  children,
  ctaLabel = "料金プランを見る",
  ctaTo = "/pricing",
}: FeatureGateProps) {
  if (allowed) {
    return <>{children}</>;
  }

  return (
    <section className="card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <span className="badge">Plan Gate</span>
          <h2 className="font-display text-xl text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <Link to={ctaTo} className="btn-primary whitespace-nowrap">
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
