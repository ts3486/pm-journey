import { useEffect, useId, useMemo, useState } from "react";
import { buildProjectOverviewData, type ProjectOverviewSection as OverviewSection } from "@/lib/productPromptSections";
import { useProductConfig } from "@/queries/productConfig";
import type { Scenario } from "@/types";

type ProjectOverviewSectionProps = {
  scenario: Scenario;
};

type ProjectOverviewModalProps = {
  titleId: string;
  scenarioTitle: string;
  productName: string;
  summary: string;
  audience: string;
  timeline: string;
  configuredSectionCount: number;
  sections: OverviewSection[];
  isOpen: boolean;
  onClose: () => void;
};

const sectionPalette = [
  { card: "border-amber-200/80 bg-amber-50/70", accent: "text-amber-700", dot: "bg-amber-500" },
  { card: "border-orange-200/80 bg-orange-50/70", accent: "text-orange-700", dot: "bg-orange-500" },
  { card: "border-rose-200/80 bg-rose-50/70", accent: "text-rose-700", dot: "bg-rose-500" },
  { card: "border-sky-200/80 bg-sky-50/70", accent: "text-sky-700", dot: "bg-sky-500" },
  { card: "border-emerald-200/80 bg-emerald-50/70", accent: "text-emerald-700", dot: "bg-emerald-500" },
  { card: "border-cyan-200/80 bg-cyan-50/70", accent: "text-cyan-700", dot: "bg-cyan-500" },
];

function ProjectOverviewModal({
  titleId,
  scenarioTitle,
  productName,
  summary,
  audience,
  timeline,
  configuredSectionCount,
  sections,
  isOpen,
  onClose,
}: ProjectOverviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[72vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-orange-200/70 bg-[#fffaf4] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-orange-100/80 bg-gradient-to-r from-orange-50/90 to-amber-50/80 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700">プロジェクト概要</p>
              <h2 id={titleId} className="font-display text-2xl text-slate-900">
                {productName || "プロダクト情報"}
              </h2>
              {summary ? <p className="max-w-3xl text-sm leading-relaxed text-slate-700">{summary}</p> : null}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-slate-700">
                  シナリオ: {scenarioTitle}
                </span>
                {audience ? (
                  <span className="rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-slate-700">
                    対象: {audience}
                  </span>
                ) : null}
                {timeline ? (
                  <span className="rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-slate-700">
                    タイムライン: {timeline}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="min-w-20 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:border-orange-300 hover:text-orange-800"
              onClick={onClose}
              aria-label="プロジェクト概要を閉じる"
            >
              閉じる
            </button>
          </div>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          {configuredSectionCount > 0 ? (
            <div className="space-y-4">
              {sections.map((section, index) => {
                const palette = sectionPalette[index % sectionPalette.length];
                return (
                  <article key={section.key} className={`rounded-2xl border p-4 ${palette.card}`}>
                    <p className={`text-sm font-semibold ${palette.accent}`}>{section.heading}</p>
                    {section.lines.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {section.lines.map((line, lineIndex) => (
                          <li
                            key={`${section.key}-${lineIndex}`}
                            className="flex items-start gap-2 text-sm leading-relaxed text-slate-700"
                          >
                            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${palette.dot}`} />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">このセクションは未設定です。</p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-5 text-sm text-orange-900">
              プロジェクト概要が未設定です。設定画面でプロジェクト背景を入力すると、ここに詳細が表示されます。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ProjectOverviewSection({ scenario }: ProjectOverviewSectionProps) {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const { data: productConfig } = useProductConfig();

  const overview = useMemo(
    () =>
      buildProjectOverviewData({
        scenario,
        productConfig,
      }),
    [scenario, productConfig]
  );

  return (
    <>
      <div className="card space-y-3 p-4">
        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-amber-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">プロジェクト概要</p>
          <p className="mt-1 text-xs leading-relaxed text-orange-900/85">
            背景、対象ユーザー、目標、制約など、このシナリオで前提となる情報をまとめて確認できます。
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-orange-700/80">
              {overview.configuredSectionCount > 0
                ? `${overview.configuredSectionCount} / ${overview.sections.length} セクション表示`
                : "概要の設定がありません"}
            </p>
            <button
              type="button"
              className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800"
              onClick={() => setIsOpen(true)}
            >
              プロジェクト概要を見る
            </button>
          </div>
        </div>
      </div>

      <ProjectOverviewModal
        titleId={titleId}
        scenarioTitle={scenario.title}
        productName={overview.productName}
        summary={overview.summary}
        audience={overview.audience}
        timeline={overview.timeline}
        configuredSectionCount={overview.configuredSectionCount}
        sections={overview.sections}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
