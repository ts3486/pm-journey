import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";
import type { Scenario, ScenarioCatalogCategory, ScenarioSummary } from "@/types";

export const useScenarios = () => {
  return useQuery({
    queryKey: queryKeys.scenarios.all(),
    queryFn: () => api.listScenarios(),
    staleTime: Infinity,
  });
};

// ---------- Derived helpers (work on the cached data) ----------

export function getScenarioDiscipline(scenario: Scenario): "BASIC" | "CHALLENGE" {
  if (scenario.scenarioType === "incident-response" || scenario.scenarioType === "business-execution") {
    return "CHALLENGE";
  }
  return "BASIC";
}

export function findScenarioById(scenarios: Scenario[] | undefined, id: string | null): Scenario | undefined {
  if (!id || !scenarios) return undefined;
  return scenarios.find((s) => s.id === id);
}

export function getDefaultScenario(scenarios: Scenario[] | undefined): Scenario | undefined {
  return scenarios?.[0];
}

export function buildHomeScenarioCatalog(scenarios: Scenario[]): ScenarioCatalogCategory[] {
  const findSummary = (id: string): ScenarioSummary | undefined => {
    const s = scenarios.find((sc) => sc.id === id);
    if (!s) return undefined;
    return { id: s.id, title: s.title, description: s.description };
  };

  const require = (id: string): ScenarioSummary => {
    const s = findSummary(id);
    if (!s) return { id, title: id, description: "" };
    return s;
  };

  return [
    {
      id: "soft-skills",
      title: "",
      subcategories: [
        {
          id: "basic-soft-skills",
          title: "基礎ソフトスキル",
          scenarios: [
            require("basic-intro-alignment"),
            require("basic-product-understanding"),
            require("basic-meeting-minutes"),
          ],
        },
      ],
    },
    {
      id: "test-cases",
      title: "",
      subcategories: [
        {
          id: "test-case-creation",
          title: "テストケース作成",
          scenarios: [
            require("test-login"),
            require("test-form"),
            require("test-file-upload"),
          ],
        },
      ],
    },
    {
      id: "requirement-definition",
      title: "",
      subcategories: [
        {
          id: "requirement-definition-foundation",
          title: "要件定義",
          scenarios: [
            require("basic-requirement-definition-doc"),
            require("basic-requirement-hearing-plan"),
            require("basic-requirement-user-story"),
          ],
        },
      ],
    },
    {
      id: "incident-response",
      title: "",
      subcategories: [
        {
          id: "incident-response-management",
          title: "障害対応",
          scenarios: [
            require("coming-incident-response"),
            require("coming-incident-triage-escalation"),
            require("coming-postmortem-followup"),
          ],
        },
      ],
    },
    {
      id: "business-execution",
      title: "",
      subcategories: [
        {
          id: "business-execution-strategy",
          title: "事業推進・戦略",
          scenarios: [
            require("coming-priority-tradeoff-workshop"),
            require("adv-data-roi"),
            require("adv-strategy-diagnosis"),
          ],
        },
      ],
    },
  ];
}
