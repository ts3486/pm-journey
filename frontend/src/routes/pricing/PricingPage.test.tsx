import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PricingPage } from "@/routes/pricing/PricingPage";
import type { PlanCode } from "@/types";
import { useEntitlements } from "@/queries/entitlements";
import { useCurrentOrganization } from "@/queries/organizations";

vi.mock("@/queries/entitlements", () => ({
  useEntitlements: vi.fn(),
}));

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
}));

const useEntitlementsMock = vi.mocked(useEntitlements);
const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);

function mockEntitlements(planCode: PlanCode) {
  useEntitlementsMock.mockReturnValue({
    data: {
      planCode,
      monthlyCredits: 0,
      teamFeatures: planCode === "TEAM",
      organizationId: planCode === "TEAM" ? "org_test" : undefined,
    },
    isLoading: false,
  } as any);
}

function mockCurrentOrganization(role: "owner" | "admin" | "manager" | "member" | "reviewer") {
  useCurrentOrganizationMock.mockReturnValue({
    data: {
      organization: {
        id: "org_test",
        name: "Test Org",
        createdByUserId: "auth0|owner",
        createdAt: "2026-02-14T00:00:00Z",
        updatedAt: "2026-02-14T00:00:00Z",
      },
      membership: {
        id: "org_member_test",
        organizationId: "org_test",
        userId: "auth0|member",
        role,
        status: "active",
        createdAt: "2026-02-14T00:00:00Z",
        updatedAt: "2026-02-14T00:00:00Z",
      },
      seatLimit: 5,
      activeMemberCount: 2,
      pendingInvitationCount: 0,
    },
    isLoading: false,
    error: null,
  } as any);
}

function mockNoOrganization() {
  useCurrentOrganizationMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
  } as any);
}

function renderPage(initialEntry = "/pricing") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <PricingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PricingPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/pricing");
    mockEntitlements("FREE");
    mockCurrentOrganization("manager");
  });

  it("shows team registration link for eligible users", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Team登録を開始" })).toHaveAttribute(
      "href",
      "/team/onboarding?flow=register",
    );
  });

  it("disables team registration for non-manager role in an existing organization", () => {
    mockCurrentOrganization("member");
    renderPage();

    expect(screen.getByRole("button", { name: "Team登録を開始" })).toBeDisabled();
    expect(screen.getByText("Teamチェックアウトは owner / admin / manager のみ実行できます。")).toBeInTheDocument();
  });

  it("allows team registration flow start without organization membership", () => {
    mockNoOrganization();
    renderPage();

    expect(screen.getByRole("link", { name: "Team登録を開始" })).toHaveAttribute(
      "href",
      "/team/onboarding?flow=register",
    );
    expect(screen.getByRole("link", { name: "招待で既存チームに参加する場合はこちら" })).toHaveAttribute(
      "href",
      "/team/onboarding",
    );
  });

  it("shows checkout success message when returning from stripe", () => {
    window.history.replaceState({}, "", "/pricing?checkout=success&plan=team");
    renderPage("/pricing");

    expect(
      screen.getByText("Teamチェックアウトが完了しました。プラン反映まで少し時間がかかる場合があります。"),
    ).toBeInTheDocument();
  });
});
