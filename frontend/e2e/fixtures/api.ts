import type { Page } from "@playwright/test";

const API_BASE = "http://localhost:3001";

export const mockScenarios = [
  {
    id: "basic-intro-alignment",
    title: "はじめての認識合わせ",
    description: "PMとして初めてのタスクに挑戦します。",
    scenarioType: "soft-skills",
    ratingCriteria: [],
  },
  {
    id: "basic-product-understanding",
    title: "製品理解の確認",
    description: "製品について深く理解します。",
    scenarioType: "soft-skills",
    ratingCriteria: [],
  },
  {
    id: "basic-meeting-minutes",
    title: "議事録作成",
    description: "会議の議事録を作成します。",
    scenarioType: "soft-skills",
    ratingCriteria: [],
  },
  {
    id: "test-login",
    title: "ログイン画面のテストケース",
    description: "ログイン機能のテストケースを作成します。",
    scenarioType: "test-cases",
    ratingCriteria: [],
  },
  {
    id: "test-form",
    title: "フォーム入力のテストケース",
    description: "フォーム入力のテストケースを作成します。",
    scenarioType: "test-cases",
    ratingCriteria: [],
  },
  {
    id: "test-file-upload",
    title: "ファイルアップロードのテストケース",
    description: "ファイルアップロードのテストケースを作成します。",
    scenarioType: "test-cases",
    ratingCriteria: [],
  },
  {
    id: "basic-requirement-definition-doc",
    title: "要件定義書の作成",
    description: "要件定義書を作成します。",
    scenarioType: "requirement-definition",
    ratingCriteria: [],
  },
  {
    id: "basic-requirement-hearing-plan",
    title: "ヒアリング計画の作成",
    description: "ヒアリング計画を作成します。",
    scenarioType: "requirement-definition",
    ratingCriteria: [],
  },
  {
    id: "basic-requirement-user-story",
    title: "ユーザーストーリーの作成",
    description: "ユーザーストーリーを作成します。",
    scenarioType: "requirement-definition",
    ratingCriteria: [],
  },
  {
    id: "coming-incident-response",
    title: "障害対応（準備中）",
    description: "障害対応のシナリオです。",
    scenarioType: "incident-response",
    ratingCriteria: [],
  },
  {
    id: "coming-incident-triage-escalation",
    title: "トリアージとエスカレーション（準備中）",
    description: "トリアージのシナリオです。",
    scenarioType: "incident-response",
    ratingCriteria: [],
  },
  {
    id: "coming-postmortem-followup",
    title: "ポストモーテム（準備中）",
    description: "ポストモーテムのシナリオです。",
    scenarioType: "incident-response",
    ratingCriteria: [],
  },
  {
    id: "coming-priority-tradeoff-workshop",
    title: "優先度トレードオフ（準備中）",
    description: "優先度トレードオフのシナリオです。",
    scenarioType: "business-execution",
    ratingCriteria: [],
  },
  {
    id: "adv-data-roi",
    title: "データROI分析",
    description: "データROIのシナリオです。",
    scenarioType: "business-execution",
    ratingCriteria: [],
  },
  {
    id: "adv-strategy-diagnosis",
    title: "戦略診断",
    description: "戦略診断のシナリオです。",
    scenarioType: "business-execution",
    ratingCriteria: [],
  },
];

export const mockHistoryItems = [
  {
    sessionId: "session-abc-001",
    scenarioId: "basic-intro-alignment",
    scenarioDiscipline: "BASIC",
    evaluation: { overallScore: 85 },
    metadata: { startedAt: "2026-02-10T10:00:00Z" },
    actions: [],
  },
  {
    sessionId: "session-abc-002",
    scenarioId: "test-login",
    scenarioDiscipline: "BASIC",
    evaluation: null,
    metadata: { startedAt: "2026-02-15T14:30:00Z" },
    actions: [],
  },
];

/**
 * Sets up route mocks for the backend REST API.
 * Call this before page.goto() in each test.
 */
export async function setupApiMocks(page: Page): Promise<void> {
  // Scenarios catalog
  await page.route(`${API_BASE}/scenarios`, async (route) => {
    await route.fulfill({ json: mockScenarios });
  });

  // Session history (GET only; POST falls through to real server or other mocks)
  await page.route(`${API_BASE}/sessions`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: [] });
    } else {
      await route.fallback();
    }
  });

  // Individual session
  await page.route(`${API_BASE}/sessions/**`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 404, json: { error: "session not found" } });
    } else {
      await route.fallback();
    }
  });

  // Current user account
  await page.route(`${API_BASE}/me`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: {
          id: "user-e2e-001",
          email: "test@example.com",
          name: "E2E Test User",
          createdAt: "2024-01-01T00:00:00Z",
        },
      });
    } else {
      await route.fallback();
    }
  });

  // Entitlements (FREE plan)
  await page.route(`${API_BASE}/me/entitlements`, async (route) => {
    await route.fulfill({
      json: { planCode: "FREE", features: [] },
    });
  });

  // Current organization (user has no org)
  await page.route(`${API_BASE}/organizations/current`, async (route) => {
    await route.fulfill({ status: 404, json: { error: "not found" } });
  });
}

/**
 * Override the sessions mock to return history items.
 * Call after setupApiMocks() to replace the empty sessions mock.
 */
export async function setupHistoryMocks(page: Page): Promise<void> {
  await page.route(`${API_BASE}/sessions`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: mockHistoryItems });
    } else {
      await route.fallback();
    }
  });
}
