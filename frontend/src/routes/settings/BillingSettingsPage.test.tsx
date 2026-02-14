import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingSettingsPage, billingPortalNavigator } from "@/routes/settings/BillingSettingsPage";
import type { PlanCode } from "@/types";
import { env } from "@/config/env";
import { useEntitlements } from "@/queries/entitlements";
import { useCurrentOrganization, useCurrentOrganizationMembers } from "@/queries/organizations";
import { api } from "@/services/api";

vi.mock("@/queries/entitlements", () => ({
  useEntitlements: vi.fn(),
}));

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
  useCurrentOrganizationMembers: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    createBillingPortalSession: vi.fn(),
  },
}));

const useEntitlementsMock = vi.mocked(useEntitlements);
const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);
const useCurrentOrganizationMembersMock = vi.mocked(useCurrentOrganizationMembers);
const createBillingPortalSessionMock = vi.mocked(api.createBillingPortalSession);

function mockEntitlements(planCode: PlanCode) {
  useEntitlementsMock.mockReturnValue({
    data: {
      planCode,
      monthlyCredits: 0,
      teamFeatures: planCode === "TEAM",
      organizationId: planCode === "TEAM" ? "org_test" : undefined,
    },
    isLoading: false,
    isError: false,
    error: null,
  } as any);
}

function mockCurrentOrganization(role: "owner" | "admin" | "manager" | "member" | "reviewer" = "admin") {
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
        userId: "auth0|admin",
        role,
        status: "active",
        createdAt: "2026-02-14T00:00:00Z",
        updatedAt: "2026-02-14T00:00:00Z",
      },
      seatLimit: 5,
      activeMemberCount: 2,
      pendingInvitationCount: 1,
    },
    isLoading: false,
    error: null,
  } as any);
}

function mockOrganizationMembers() {
  useCurrentOrganizationMembersMock.mockReturnValue({
    data: {
      members: [],
      seatLimit: 5,
      activeMemberCount: 2,
      pendingInvitationCount: 1,
    },
    isLoading: false,
    error: null,
  } as any);
}

describe("BillingSettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockCurrentOrganization();
    mockOrganizationMembers();
  });

  it("shows free plan billing state and hides team management entry", () => {
    mockEntitlements("FREE");

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    if (!env.billingEnabled) {
      expect(screen.getByText("Billing Disabled")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "チーム作成 / 招待へ" })).toHaveAttribute("href", "/team/onboarding");
      expect(screen.getByRole("link", { name: "Team管理を開く" })).toHaveAttribute("href", "/settings/team");
      return;
    }

    expect(screen.getByText("現在のプラン: Free")).toBeInTheDocument();
    expect(screen.getByText("支払い状態:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("未契約")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "アップグレードする" })).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("link", { name: "Team管理を開く" })).not.toBeInTheDocument();
  });

  it("shows team plan billing state and team management entry", () => {
    mockEntitlements("TEAM");

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    if (!env.billingEnabled) {
      expect(screen.getByText("Billing Disabled")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Team管理を開く" })).toHaveAttribute("href", "/settings/team");
      expect(screen.queryByRole("button", { name: "請求情報を管理" })).not.toBeInTheDocument();
      return;
    }

    expect(screen.getByText("現在のプラン: Team")).toBeInTheDocument();
    expect(screen.getByText("有効")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "料金ページを開く" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("button", { name: "請求情報を管理" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team管理を開く" })).toHaveAttribute("href", "/settings/team");
  });

  it("opens billing portal from team plan", async () => {
    mockEntitlements("TEAM");
    createBillingPortalSessionMock.mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    });
    const assignSpy = vi.spyOn(billingPortalNavigator, "assign").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    if (!env.billingEnabled) {
      expect(screen.getByText("Billing Disabled")).toBeInTheDocument();
      expect(createBillingPortalSessionMock).not.toHaveBeenCalled();
      expect(assignSpy).not.toHaveBeenCalled();
      return;
    }

    fireEvent.click(screen.getByRole("button", { name: "請求情報を管理" }));

    await waitFor(() => {
      expect(createBillingPortalSessionMock).toHaveBeenCalledTimes(1);
    });
    expect(createBillingPortalSessionMock).toHaveBeenCalledWith({
      returnUrl: `${window.location.origin}/settings/billing`,
    });
    expect(assignSpy).toHaveBeenCalledWith("https://billing.stripe.com/session/test");
  });

  it("hides team management entry for non-admin members", () => {
    mockEntitlements("TEAM");
    mockCurrentOrganization("member");

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Team管理を開く" })).not.toBeInTheDocument();
  });
});
