import type { CertificateStatus } from "@/lib/certificate";

type CertificateProgressCardProps = {
  certificateStatus: CertificateStatus;
};

export function CertificateProgressCard({ certificateStatus }: CertificateProgressCardProps) {
  const progressPercent =
    certificateStatus.totalRequired > 0
      ? Math.round((certificateStatus.totalPassed / certificateStatus.totalRequired) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Certificate
            </p>
            <h2 className="font-display text-lg text-slate-400">PM Journey 修了証</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            未取得
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>合格進捗</span>
            <span>
              {certificateStatus.totalPassed} / {certificateStatus.totalRequired} シナリオ合格
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
            <div
              className="h-full rounded-full bg-slate-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {certificateStatus.categories.map((cat) => (
            <span
              key={cat.categoryId}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                cat.allPassed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {cat.categoryTitle} {cat.passedCount}/{cat.totalScenarios} 合格
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
