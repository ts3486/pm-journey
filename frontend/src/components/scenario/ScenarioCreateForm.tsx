"use client";

import { useReducer, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Scenario } from "@/types/session";
import {
  type ScenarioInput,
  type RatingCriterionInput,
  type MissionInput,
  type ScenarioBehaviorInput,
  type ProductInput,
  defaultScenarioInput,
  validateScenario,
} from "@/schemas/scenario";
import { scenarioService } from "@/services/scenarioService";
import { ScenarioCloneSelector } from "./ScenarioCloneSelector";

// ============================================================================
// State Types
// ============================================================================

type ScenarioFormState = {
  data: ScenarioInput;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
};

type ScenarioFormAction =
  | { type: "SET_FIELD"; field: keyof ScenarioInput; value: unknown }
  | { type: "SET_PRODUCT"; value: ProductInput }
  | { type: "SET_BEHAVIOR"; value: ScenarioBehaviorInput }
  | { type: "SET_CRITERIA"; value: RatingCriterionInput[] }
  | { type: "SET_MISSIONS"; value: MissionInput[] }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "SET_TOUCHED"; field: string }
  | { type: "RESET"; data?: ScenarioInput }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "CLONE"; scenario: Scenario };

// ============================================================================
// Reducer
// ============================================================================

function formReducer(
  state: ScenarioFormState,
  action: ScenarioFormAction
): ScenarioFormState {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
        isDirty: true,
      };

    case "SET_PRODUCT":
      return {
        ...state,
        data: { ...state.data, product: action.value },
        isDirty: true,
      };

    case "SET_BEHAVIOR":
      return {
        ...state,
        data: { ...state.data, behavior: action.value },
        isDirty: true,
      };

    case "SET_CRITERIA":
      return {
        ...state,
        data: { ...state.data, evaluationCriteria: action.value },
        isDirty: true,
      };

    case "SET_MISSIONS":
      return {
        ...state,
        data: { ...state.data, missions: action.value },
        isDirty: true,
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.errors,
      };

    case "SET_TOUCHED":
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };

    case "RESET":
      return {
        data: action.data ?? defaultScenarioInput,
        errors: {},
        touched: {},
        isSubmitting: false,
        isDirty: false,
      };

    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.value,
      };

    case "CLONE": {
      const cloned = { ...action.scenario };
      // Generate new ID with suffix
      const newId = `${cloned.id}-copy`;
      // Add (コピー) to title
      const newTitle = `${cloned.title} (コピー)`;
      return {
        ...state,
        data: {
          ...cloned,
          id: newId,
          title: newTitle,
        } as ScenarioInput,
        errors: {},
        touched: {},
        isDirty: true,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ScenarioFormState = {
  data: defaultScenarioInput,
  errors: {},
  touched: {},
  isSubmitting: false,
  isDirty: false,
};

// ============================================================================
// Component
// ============================================================================

export function ScenarioCreateForm() {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Field change handler
  const handleFieldChange = useCallback(
    (field: keyof ScenarioInput, value: unknown) => {
      dispatch({ type: "SET_FIELD", field, value });
    },
    []
  );

  // Clone handler
  const handleClone = useCallback((scenario: Scenario) => {
    dispatch({ type: "CLONE", scenario });
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  // Validation
  const validate = useCallback((): boolean => {
    const result = validateScenario(state.data);
    if (result.success) {
      dispatch({ type: "SET_ERRORS", errors: {} });
      return true;
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.errors) {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    }
    dispatch({ type: "SET_ERRORS", errors });
    return false;
  }, [state.data]);

  // Submit handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      setSubmitSuccess(false);

      if (!validate()) {
        // Scroll to first error
        const firstErrorField = document.querySelector("[data-error='true']");
        firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      dispatch({ type: "SET_SUBMITTING", value: true });

      try {
        const result = await scenarioService.createScenario(state.data);

        if (result.success) {
          setSubmitSuccess(true);
          // Redirect to home or scenario list after short delay
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          setSubmitError(result.error);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "保存に失敗しました"
        );
      } finally {
        dispatch({ type: "SET_SUBMITTING", value: false });
      }
    },
    [state.data, validate, router]
  );

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (state.isDirty) {
      if (window.confirm("変更内容が失われますが、よろしいですか？")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [state.isDirty, router]);

  // Reset handler
  const handleReset = useCallback(() => {
    if (window.confirm("入力内容をリセットしますか？")) {
      dispatch({ type: "RESET" });
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="card px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              シナリオを作成
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              新しいシミュレーションシナリオを作成します
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScenarioCloneSelector onClone={handleClone} />
            <button
              type="button"
              onClick={handleReset}
              className="btn-ghost"
              disabled={!state.isDirty}
            >
              リセット
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="card border border-emerald-200/60 bg-emerald-50/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-emerald-800">
                シナリオを保存しました
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                ホーム画面に戻ります...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="card border border-rose-200/60 bg-rose-50/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-rose-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-rose-800">保存に失敗しました</p>
              <p className="text-xs text-rose-600 mt-0.5">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="card px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-ghost order-2 sm:order-1"
          >
            キャンセル
          </button>

          <div className="flex items-center gap-3 order-1 sm:order-2">
            {Object.keys(state.errors).length > 0 && (
              <span className="text-xs text-rose-500">
                {Object.keys(state.errors).length} 件の入力エラー
              </span>
            )}
            <button
              type="submit"
              className="btn-primary flex-1 sm:flex-none"
              disabled={state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  保存中...
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  シナリオを作成
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
