import { z } from "zod";

// ============================================================================
// Base Schemas
// ============================================================================

export const scoringGuidelinesSchema = z.object({
  excellent: z.string().min(1, "優秀の評価基準を入力してください"),
  good: z.string().min(1, "良好の評価基準を入力してください"),
  needsImprovement: z.string().min(1, "改善が必要の評価基準を入力してください"),
  poor: z.string().min(1, "不十分の評価基準を入力してください"),
});

export const ratingCriterionSchema = z.object({
  id: z.string().min(1, "IDを入力してください"),
  name: z.string().min(1, "名前を入力してください"),
  weight: z.number().min(0, "重みは0以上").max(100, "重みは100以下"),
  description: z.string().min(1, "説明を入力してください"),
  scoringGuidelines: scoringGuidelinesSchema,
});

export const missionSchema = z.object({
  id: z.string().min(1, "ミッションIDを入力してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  order: z.number().int().positive("順序は1以上の整数"),
});

export const scenarioBehaviorSchema = z.object({
  userLed: z.boolean().optional(),
  allowProactive: z.boolean().optional(),
  maxQuestions: z.number().int().min(0).optional(),
  responseStyle: z
    .enum(["acknowledge_then_wait", "guide_lightly", "advisor"])
    .optional(),
  phase: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "プロダクト名を入力してください"),
  summary: z.string().min(1, "概要を入力してください"),
  audience: z.string().min(1, "ターゲットを入力してください"),
  problems: z.array(z.string().min(1)).min(1, "課題を1つ以上入力してください"),
  goals: z.array(z.string().min(1)).min(1, "目標を1つ以上入力してください"),
  differentiators: z
    .array(z.string().min(1))
    .min(1, "差別化要素を1つ以上入力してください"),
  scope: z.array(z.string().min(1)).min(1, "スコープを1つ以上入力してください"),
  constraints: z
    .array(z.string().min(1))
    .min(1, "制約を1つ以上入力してください"),
  timeline: z.string().min(1, "タイムラインを入力してください"),
  successCriteria: z
    .array(z.string().min(1))
    .min(1, "成功基準を1つ以上入力してください"),
  uniqueEdge: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  coreFeatures: z.array(z.string()).optional(),
});

// ============================================================================
// Product Config Schema (for Settings page)
// ============================================================================

export const productConfigSchema = z.object({
  name: z.string().min(1, "プロダクト名を入力してください"),
  summary: z.string().min(1, "概要を入力してください"),
  audience: z.string().min(1, "ターゲットを入力してください"),
  problems: z.array(z.string()).min(1, "課題を1つ以上入力してください"),
  goals: z.array(z.string()).min(1, "目標を1つ以上入力してください"),
  differentiators: z.array(z.string()).default([]),
  scope: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  timeline: z.string().optional(),
  successCriteria: z.array(z.string()).default([]),
  uniqueEdge: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  coreFeatures: z.array(z.string()).default([]),
});

export type ProductConfigFormValues = z.infer<typeof productConfigSchema>;

// ============================================================================
// Main Scenario Schema
// ============================================================================

export const scenarioIdSchema = z
  .string()
  .min(1, "IDを入力してください")
  .regex(
    /^[a-z0-9-]+$/,
    "IDは小文字英数字とハイフンのみ使用可能です"
  );

export const scenarioSchema = z.object({
  id: scenarioIdSchema,
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().min(1, "説明を入力してください"),
  discipline: z.enum(["BASIC", "CHALLENGE"]),
  behavior: scenarioBehaviorSchema.optional(),
  product: productSchema,
  mode: z.string().min(1, "モードを入力してください"),
  kickoffPrompt: z.string().min(1, "キックオフプロンプトを入力してください"),
  evaluationCriteria: z
    .array(ratingCriterionSchema)
    .min(1, "評価基準を1つ以上追加してください")
    .refine(
      (criteria) => {
        const total = criteria.reduce((sum, c) => sum + c.weight, 0);
        return total === 100;
      },
      { message: "評価基準の重みの合計は100%である必要があります" }
    ),
  passingScore: z.number().min(0).max(100).optional(),
  missions: z.array(missionSchema).optional(),
  supplementalInfo: z.string().optional(),
});

// ============================================================================
// Form Input Schema (partial for form validation)
// ============================================================================

export const scenarioFormSchema = scenarioSchema;

// ============================================================================
// Types
// ============================================================================

export type ScoringGuidelinesInput = z.infer<typeof scoringGuidelinesSchema>;
export type RatingCriterionInput = z.infer<typeof ratingCriterionSchema>;
export type MissionInput = z.infer<typeof missionSchema>;
export type ScenarioBehaviorInput = z.infer<typeof scenarioBehaviorSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ScenarioInput = z.infer<typeof scenarioSchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateScenario(data: unknown) {
  return scenarioSchema.safeParse(data);
}

export function validatePartialScenario(data: unknown) {
  return scenarioSchema.partial().safeParse(data);
}

// ============================================================================
// Default Values
// ============================================================================

export const defaultScoringGuidelines: ScoringGuidelinesInput = {
  excellent: "",
  good: "",
  needsImprovement: "",
  poor: "",
};

export const defaultRatingCriterion: RatingCriterionInput = {
  id: "",
  name: "",
  weight: 25,
  description: "",
  scoringGuidelines: defaultScoringGuidelines,
};

export const defaultMission: MissionInput = {
  id: "",
  title: "",
  description: "",
  order: 1,
};

export const defaultBehavior: ScenarioBehaviorInput = {
  userLed: false,
  allowProactive: true,
  maxQuestions: 1,
  responseStyle: "guide_lightly",
  phase: "",
};

export const defaultProduct: ProductInput = {
  name: "",
  summary: "",
  audience: "",
  problems: [""],
  goals: [""],
  differentiators: [""],
  scope: [""],
  constraints: [""],
  timeline: "",
  successCriteria: [""],
  uniqueEdge: "",
  techStack: [],
  coreFeatures: [],
};

export const defaultScenarioInput: ScenarioInput = {
  id: "",
  title: "",
  description: "",
  discipline: "BASIC",
  behavior: defaultBehavior,
  product: defaultProduct,
  mode: "guided",
  kickoffPrompt: "",
  evaluationCriteria: [
    {
      ...defaultRatingCriterion,
      id: "criterion-1",
      weight: 100,
    },
  ],
  passingScore: 70,
  missions: [],
  supplementalInfo: "",
};
