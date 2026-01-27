"use client";

import { useEffect, useState } from "react";
import type { Scenario } from "@/types/session";
import { getAllScenariosForClone } from "@/services/scenarioService";

type ScenarioCloneSelectorProps = {
  onClone: (scenario: Scenario) => void;
};

export function ScenarioCloneSelector({ onClone }: ScenarioCloneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [builtInScenarios, setBuiltInScenarios] = useState<
    { discipline: string; title: string; scenarios: Scenario[] }[]
  >([]);
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const loadScenarios = async () => {
      setLoading(true);
      try {
        const { builtIn, custom } = await getAllScenariosForClone();
        setBuiltInScenarios(builtIn);
        setCustomScenarios(custom);
      } catch (e) {
        console.error("Failed to load scenarios for clone", e);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      loadScenarios();
    }
  }, [isOpen]);

  const handleSelect = (scenario: Scenario) => {
    onClone(scenario);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        既存からコピー
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 overflow-auto rounded-xl border border-slate-200/80 bg-white shadow-xl">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
              </div>
            ) : (
              <div className="py-2">
                {/* Built-in Scenarios */}
                {builtInScenarios.map((section) => (
                  <div key={section.discipline}>
                    <div className="px-3 py-2 bg-slate-50">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {section.title}
                      </p>
                    </div>
                    {section.scenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => handleSelect(scenario)}
                        className="w-full px-3 py-2 text-left hover:bg-orange-50 transition"
                      >
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {scenario.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {scenario.description}
                        </p>
                      </button>
                    ))}
                  </div>
                ))}

                {/* Custom Scenarios */}
                {customScenarios.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-slate-50">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        カスタムシナリオ
                      </p>
                    </div>
                    {customScenarios.map((scenario) => (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => handleSelect(scenario)}
                        className="w-full px-3 py-2 text-left hover:bg-orange-50 transition"
                      >
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {scenario.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {scenario.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {builtInScenarios.every((s) => s.scenarios.length === 0) &&
                  customScenarios.length === 0 && (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      コピー可能なシナリオがありません
                    </div>
                  )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
