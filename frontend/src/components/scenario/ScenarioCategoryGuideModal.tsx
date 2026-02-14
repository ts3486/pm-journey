import { useEffect, useId, useRef, useState } from "react";
import { env } from "@/config/env";
import type { Scenario } from "@/types";

export type ScenarioGuide = {
  scenarioId: string;
  scenarioTitle: string;
  guidanceSentence: string;
};

type ScenarioCategoryGuideModalProps = {
  guide: ScenarioGuide;
  isOpen: boolean;
  onClose: () => void;
};

const GUIDE_SEEN_STORAGE_SUFFIX = "scenario-guide-seen";
const GUIDE_MODAL_APPEAR_DELAY_MS = 140;
const GUIDE_MODAL_CLOSE_DURATION_MS = 200;

export function buildScenarioGuide(scenario: Scenario): ScenarioGuide {
  const fallbackMessage = `${scenario.description}このシナリオに取り組みましょう。`;
  const guidanceSentence = scenario.guideMessage?.trim() || fallbackMessage;

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    guidanceSentence,
  };
}

export function getScenarioGuideSeenStorageKey(scenarioId: string): string {
  return `${env.storageKeyPrefix}:${GUIDE_SEEN_STORAGE_SUFFIX}:${scenarioId}`;
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
                {guide.scenarioTitle}
              </h2>
            </div>
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-orange-200 bg-white text-base font-semibold text-orange-700 transition hover:border-orange-300 hover:text-orange-800"
              onClick={onClose}
              aria-label="シナリオガイドを閉じる"
            >
              ×
            </button>
          </div>
        </header>

        <div className="px-6 py-7 sm:px-8">
          <p className="mx-auto max-w-[42rem] text-[18px] leading-8 text-slate-800">{guide.guidanceSentence}</p>
        </div>

        <div className="flex justify-end border-t border-orange-100/80 px-6 py-4 sm:px-8">
          <button type="button" className="btn-primary" onClick={onClose}>
            開始する
          </button>
        </div>
      </section>
    </div>
  );
}
