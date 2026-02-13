import { useEffect, useId, useRef, useState } from "react";
import { homeScenarioCatalog } from "@/config";
import { env } from "@/config/env";

type SupportedGuideCategoryId =
  | "soft-skills"
  | "test-cases"
  | "requirement-definition"
  | "incident-response"
  | "business-execution";

export type ScenarioCategoryGuide = {
  categoryId: SupportedGuideCategoryId;
  categoryTitle: string;
  steps: string[];
  completionHint: string;
};

type ScenarioCategoryGuideModalProps = {
  guide: ScenarioCategoryGuide;
  isOpen: boolean;
  onClose: () => void;
};

const GUIDE_SEEN_STORAGE_SUFFIX = "scenario-category-guide-seen";
const GUIDE_MODAL_APPEAR_DELAY_MS = 140;
const GUIDE_MODAL_CLOSE_DURATION_MS = 200;

const categoryGuides: Record<SupportedGuideCategoryId, ScenarioCategoryGuide> = {
  "soft-skills": {
    categoryId: "soft-skills",
    categoryTitle: "基礎ソフトスキル",
    steps: [
      "ガイドエージェントの説明とミッションを読んで、1回で伝える要点を整理してください。",
      "返答では「状況理解・確認したいこと・次アクション」を短く含めてください。",
      "このカテゴリは1回の応答でシナリオが終了します。送信前に内容を見直してください。",
    ],
    completionHint: "ミッション達成後に「シナリオを完了する」を押すと、評価画面に遷移します。",
  },
  "test-cases": {
    categoryId: "test-cases",
    categoryTitle: "テストケース作成",
    steps: [
      "機能デザインとミッションを確認し、最初に検証範囲を決めてください。",
      "正常系・異常系・境界値を意識して、必要なテストケースを追加してください。",
      "各ケースは「前提条件・手順・期待結果」がすぐ分かる形で記述してください。",
    ],
    completionHint: "必要なテストケースを作成したら「テストケースを提出する」を押して評価に進みます。",
  },
  "requirement-definition": {
    categoryId: "requirement-definition",
    categoryTitle: "要件定義",
    steps: [
      "エージェント説明とミッションを読み、今回定義する要件の目的を明確にしてください。",
      "対象ユーザー・課題・制約を確認し、受入条件まで具体化してください。",
      "優先度と未確定事項を分けて整理し、合意しやすい形でまとめてください。",
    ],
    completionHint: "ミッション達成後に「シナリオを完了する」を押すと、評価画面に遷移します。",
  },
  "incident-response": {
    categoryId: "incident-response",
    categoryTitle: "障害対応",
    steps: [
      "最初に影響範囲と緊急度を整理し、初動方針を決めてください。",
      "状況共有は短く明確に行い、担当者と次回更新タイミングを示してください。",
      "暫定対応と恒久対応を分けて、再発防止アクションまでまとめてください。",
    ],
    completionHint: "ミッション達成後に「シナリオを完了する」を押すと、評価画面に遷移します。",
  },
  "business-execution": {
    categoryId: "business-execution",
    categoryTitle: "事業推進",
    steps: [
      "ミッションを確認し、達成したい事業目標と判断基準を先に決めてください。",
      "選択肢ごとのメリット・リスク・コストを比較して、推奨案を示してください。",
      "合意した施策を担当・期限付きで整理し、実行計画として締めてください。",
    ],
    completionHint: "ミッション達成後に「シナリオを完了する」を押すと、評価画面に遷移します。",
  },
};

const scenarioCategoryByScenarioId = new Map<string, SupportedGuideCategoryId>();

homeScenarioCatalog.forEach((category) => {
  if (!(category.id in categoryGuides)) return;
  const categoryId = category.id as SupportedGuideCategoryId;
  category.subcategories.forEach((subcategory) => {
    subcategory.scenarios.forEach((scenario) => {
      scenarioCategoryByScenarioId.set(scenario.id, categoryId);
    });
  });
});

export function getScenarioCategoryGuide(scenarioId: string): ScenarioCategoryGuide | null {
  const categoryId = scenarioCategoryByScenarioId.get(scenarioId);
  if (!categoryId) return null;
  return categoryGuides[categoryId] ?? null;
}

export function getScenarioGuideSeenStorageKey(categoryId: string): string {
  return `${env.storageKeyPrefix}:${GUIDE_SEEN_STORAGE_SUFFIX}:${categoryId}`;
}

export function ScenarioCategoryGuideModal({
  guide,
  isOpen,
  onClose,
}: ScenarioCategoryGuideModalProps) {
  const titleId = useId();
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const appearTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (appearTimeoutRef.current !== null) {
      window.clearTimeout(appearTimeoutRef.current);
      appearTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      clearTimers();
      setShouldRender(true);
      setIsVisible(false);
      appearTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
        appearTimeoutRef.current = null;
      }, GUIDE_MODAL_APPEAR_DELAY_MS);
      return;
    }

    if (!shouldRender) return;
    clearTimers();
    setIsVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setShouldRender(false);
      closeTimeoutRef.current = null;
    }, GUIDE_MODAL_CLOSE_DURATION_MS);
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return;

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
  }, [shouldRender, onClose]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 sm:p-6 ${
        isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-orange-200/80 bg-[#fffaf4] shadow-2xl transition-all duration-300 ease-out ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-orange-100/80 bg-linear-to-r from-orange-50/90 to-amber-50/80 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700">シナリオガイド</p>
              <h2 id={titleId} className="font-display text-2xl text-slate-900">
                {guide.categoryTitle}
              </h2>
              <p className="text-sm text-slate-600">進め方を確認してから開始すると、評価につながる回答が作りやすくなります。</p>
            </div>
            <button
              type="button"
              className="min-w-20 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:border-orange-300 hover:text-orange-800"
              onClick={onClose}
              aria-label="シナリオガイドを閉じる"
            >
              閉じる
            </button>
          </div>
        </header>

        <div className="space-y-4 px-6 py-6">
          <ol className="space-y-3">
            {guide.steps.map((step, index) => (
              <li key={`${guide.categoryId}-step-${index}`} className="rounded-2xl border border-orange-200/80 bg-white/80 p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-slate-700">{step}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
            <p className="text-sm font-medium leading-relaxed text-emerald-900">{guide.completionHint}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
