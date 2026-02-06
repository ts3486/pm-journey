import { env } from "@/config/env";
import type { Scenario } from "@pm-journey/types";
import { validateScenario, type ScenarioInput } from "@/schemas/scenario";
import { api } from "@/services/api";

// ============================================================================
// Types
// ============================================================================

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// Storage Keys
// ============================================================================

const isBrowser = typeof window !== "undefined";

const STORAGE_KEY = `${env.storageKeyPrefix}:custom-scenarios`;

// ============================================================================
// Internal Helpers
// ============================================================================

function loadAllScenarios(): Scenario[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Failed to load custom scenarios from localStorage");
    return [];
  }
}

function saveAllScenarios(scenarios: Scenario[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch (e) {
    console.error("Failed to save custom scenarios to localStorage", e);
  }
}

// ============================================================================
// Scenario Service
// ============================================================================

export const scenarioService = {
  /**
   * Create a new custom scenario.
   */
  async createScenario(input: ScenarioInput): Promise<Result<Scenario>> {
    const validation = validateScenario(input);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message ?? "入力内容に問題があります",
      };
    }

    const scenarios = loadAllScenarios();

    // Check for duplicate ID
    if (scenarios.some((s) => s.id === input.id)) {
      return {
        success: false,
        error: `ID "${input.id}" は既に使用されています`,
      };
    }

    const newScenario = validation.data as Scenario;

    if (env.apiBase) {
      try {
        const created = await api.createScenario(newScenario);
        scenarios.push(created);
        saveAllScenarios(scenarios);
        return { success: true, data: created };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "保存に失敗しました",
        };
      }
    }

    scenarios.push(newScenario);
    saveAllScenarios(scenarios);

    return { success: true, data: newScenario };
  },

  /**
   * Get a custom scenario by ID.
   */
  async getScenario(id: string): Promise<Result<Scenario>> {
    const scenarios = loadAllScenarios();
    const scenario = scenarios.find((s) => s.id === id);

    if (!scenario) {
      return {
        success: false,
        error: `シナリオ "${id}" が見つかりません`,
      };
    }

    return { success: true, data: scenario };
  },

  /**
   * List all custom scenarios.
   */
  async listScenarios(): Promise<Result<Scenario[]>> {
    const scenarios = loadAllScenarios();
    return { success: true, data: scenarios };
  },

  /**
   * Update an existing custom scenario.
   */
  async updateScenario(input: ScenarioInput): Promise<Result<Scenario>> {
    const validation = validateScenario(input);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message ?? "入力内容に問題があります",
      };
    }

    const scenarios = loadAllScenarios();
    const index = scenarios.findIndex((s) => s.id === input.id);

    if (index === -1) {
      return {
        success: false,
        error: `シナリオ "${input.id}" が見つかりません`,
      };
    }

    const updatedScenario = validation.data as Scenario;
    scenarios[index] = updatedScenario;
    saveAllScenarios(scenarios);

    return { success: true, data: updatedScenario };
  },

  /**
   * Delete a custom scenario by ID.
   */
  async deleteScenario(id: string): Promise<Result<void>> {
    const scenarios = loadAllScenarios();
    const index = scenarios.findIndex((s) => s.id === id);

    if (index === -1) {
      return {
        success: false,
        error: `シナリオ "${id}" が見つかりません`,
      };
    }

    scenarios.splice(index, 1);
    saveAllScenarios(scenarios);

    return { success: true, data: undefined };
  },

  /**
   * Check if a scenario ID already exists in custom scenarios.
   */
  async existsScenario(id: string): Promise<boolean> {
    const scenarios = loadAllScenarios();
    return scenarios.some((s) => s.id === id);
  },

  /**
   * Generate a unique ID based on a base ID.
   */
  async generateUniqueId(baseId: string): Promise<string> {
    const scenarios = loadAllScenarios();
    let candidate = baseId;
    let counter = 1;

    while (scenarios.some((s) => s.id === candidate)) {
      candidate = `${baseId}-${counter}`;
      counter++;
    }

    return candidate;
  },
};

// ============================================================================
// Integration with built-in scenarios
// ============================================================================

import { getScenarioById as getBuiltInScenario, scenarioCatalog } from "@pm-journey/config";

/**
 * Get a scenario by ID, checking both custom and built-in scenarios.
 */
export async function getScenarioByIdUnified(
  id: string
): Promise<Scenario | undefined> {
  // First check custom scenarios
  const result = await scenarioService.getScenario(id);
  if (result.success) {
    return result.data;
  }

  // Fall back to built-in scenarios
  return getBuiltInScenario(id);
}

/**
 * Get all scenarios (both custom and built-in) for cloning.
 */
export async function getAllScenariosForClone(): Promise<{
  builtIn: { discipline: string; title: string; scenarios: Scenario[] }[];
  custom: Scenario[];
}> {
  const customResult = await scenarioService.listScenarios();
  const customScenarios = customResult.success ? customResult.data : [];

  // Get built-in scenarios from catalog
  const builtInScenarios = scenarioCatalog.map((section) => ({
    discipline: section.discipline,
    title: section.title,
    scenarios: section.scenarios
      .map((summary) => getBuiltInScenario(summary.id))
      .filter((s): s is Scenario => s !== undefined),
  }));

  return {
    builtIn: builtInScenarios,
    custom: customScenarios,
  };
}
