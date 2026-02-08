import { comingSoonScenarios, homeScenarioCatalog } from "@/config";
import type {
  ScenarioCatalogCategory,
  ScenarioCatalogSubcategory,
  ScenarioSummary,
} from "@/types";
import { useStorage } from "@/hooks/useStorage";
import { Link } from "react-router-dom";
import { CSSProperties, useEffect, useRef, useState } from "react";

const revealDelay = (delay: number): CSSProperties => ({ "--delay": `${delay}ms` } as CSSProperties);
const homeScenarioIds = homeScenarioCatalog.flatMap((category: ScenarioCatalogCategory) =>
  category.subcategories.flatMap((subcategory: ScenarioCatalogSubcategory) =>
    subcategory.scenarios.map((scenario: ScenarioSummary) => scenario.id)
  )
);
type ScenarioCarouselProps = {
  title: string;
  scenarios: ScenarioSummary[];
  savedByScenario: Record<string, boolean>;
  baseDelay: number;
};

function ScenarioCarousel({ title, scenarios, savedByScenario, baseDelay }: ScenarioCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const amount = Math.max(240, Math.min(scroller.clientWidth * 0.9, 520));
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label={`${title} を左へスクロール`}
          className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-200/70 bg-white/90 text-slate-600 shadow-sm transition hover:border-orange-300 hover:text-orange-700 sm:flex sm:items-center sm:justify-center"
        >
          ◀
        </button>
        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto pb-2 px-6 snap-x snap-mandatory scroll-px-6 sm:px-10"
        >
          {scenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className="card flex w-65 shrink-0 flex-col justify-between p-5 reveal snap-start sm:w-[280px] lg:w-[300px]"
              style={revealDelay(baseDelay + index * 60)}
            >
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-900">{scenario.title}</h4>
                <p className="text-sm text-slate-600">{scenario.description}</p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link className="btn-primary" to={`/scenario?scenarioId=${scenario.id}&restart=1`}>
                  このシナリオを始める
                </Link>
                {savedByScenario[scenario.id] && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    中断中
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label={`${title} を右へスクロール`}
          className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-200/70 bg-white/90 text-slate-600 shadow-sm transition hover:border-orange-300 hover:text-orange-700 sm:flex sm:items-center sm:justify-center"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function ComingSoonCarousel({ baseDelay }: { baseDelay: number }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const amount = Math.max(240, Math.min(scroller.clientWidth * 0.9, 520));
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Coming Soon を左へスクロール"
          className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70 bg-white/90 text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600 sm:flex sm:items-center sm:justify-center"
        >
          ◀
        </button>
        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto pb-2 px-6 snap-x snap-mandatory scroll-px-6 sm:px-10"
        >
          {comingSoonScenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className="card flex w-65 shrink-0 flex-col justify-between p-5 reveal snap-start sm:w-[280px] lg:w-[300px] opacity-60 grayscale-[30%]"
              style={revealDelay(baseDelay + index * 60)}
            >
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-slate-900">{scenario.title}</h4>
                <p className="text-sm text-slate-600">{scenario.description}</p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400 cursor-default select-none">
                  🔒 Coming Soon
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Coming Soon を右へスクロール"
          className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200/70 bg-white/90 text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600 sm:flex sm:items-center sm:justify-center"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export function HomePage() {
  const storage = useStorage();
  const [savedByScenario, setSavedByScenario] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadSavedSessions() {
      const entries = await Promise.all(
        homeScenarioIds.map(async (scenarioId) => {
          const lastSessionId = await storage.loadLastSessionId(scenarioId);
          return [scenarioId, !!lastSessionId] as const;
        })
      );
      setSavedByScenario(Object.fromEntries(entries));
    }
    void loadSavedSessions();
  }, [storage]);

  return (
    <div className="space-y-12">
      <section className="space-y-10 reveal" style={revealDelay(120)}>
        {homeScenarioCatalog.map((category: ScenarioCatalogCategory, categoryIndex) => (
          <div key={category.id} className="space-y-6">
            {category.subcategories.map((subcategory: ScenarioCatalogSubcategory, subIndex) => (
              <div key={subcategory.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{subcategory.title}</h3>
                    <p className="text-sm text-slate-500">シナリオ {subcategory.scenarios.length} 件</p>
                  </div>
                </div>
                <ScenarioCarousel
                  title={subcategory.title}
                  scenarios={subcategory.scenarios}
                  savedByScenario={savedByScenario}
                  baseDelay={220 + subIndex * 160}
                />
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="space-y-6 reveal" style={revealDelay(500)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Upcoming</p>
            <h2 className="font-display text-xl text-slate-900">Coming Soon</h2>
            <p className="text-sm text-slate-500">今後追加予定のシナリオです</p>
          </div>
        </div>
        <ComingSoonCarousel baseDelay={560} />
      </section>
    </div>
  );
}
