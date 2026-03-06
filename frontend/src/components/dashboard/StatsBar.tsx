type StatsBarProps = {
  completedCount: number;
  totalCount: number;
  passRate: number;
  overallProgress: number;
};

type StatPillProps = {
  label: string;
  value: string;
};

function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="rounded-xl border border-[rgba(203,149,102,0.35)] bg-white/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

export function StatsBar({ completedCount, totalCount, passRate, overallProgress }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatPill label="完了シナリオ" value={`${completedCount} / ${totalCount}`} />
      <StatPill label="合格率" value={`${passRate}%`} />
      <StatPill label="全体進捗" value={`${overallProgress}%`} />
    </div>
  );
}
