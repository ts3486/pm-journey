import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingSettingsPage, billingPortalNavigator } from "@/routes/settings/BillingSettingsPage";
import type { PlanCode } from "@/types";
import { useEntitlements } from "@/queries/entitlements";
import { api } from "@/services/api";

vi.mock("@/queries/entitlements", () => ({
  useEntitlements: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    createBillingPortalSession: vi.fn(),
  },
}));

const useEntitlementsMock = vi.mocked(useEntitlements);
const createBillingPortalSessionMock = vi.mocked(api.createBillingPortalSession);

function mockEntitlements(planCode: PlanCode) {
  useEntitlementsMock.mockReturnValue({
    data: {
      planCode,
      monthlyCredits: 0,
      teamFeatures: false,
    },
    isLoading: false,
    isError: false,
    error: null,
  } as any);
}

describe("BillingSettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("shows free plan billing state and upgrade CTA", () => {
    mockEntitlements("FREE");

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("現在のプラン: Free")).toBeInTheDocument();
    expect(screen.getByText("支払い状態:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("未契約")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Individualを開始" })).toHaveAttribute("href", "/pricing");
  });

  it("shows individual plan billing state", () => {
    mockEntitlements("INDIVIDUAL");

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("現在のプラン: Individual")).toBeInTheDocument();
    expect(screen.getByText("有効")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "料金ページを開く" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("button", { name: "請求情報を管理" })).toBeInTheDocument();
  });

  it("opens billing portal from individual plan", async () => {
    mockEntitlements("INDIVIDUAL");
    createBillingPortalSessionMock.mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    });
    const assignSpy = vi.spyOn(billingPortalNavigator, "assign").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <BillingSettingsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "請求情報を管理" }));

    await waitFor(() => {
      expect(createBillingPortalSessionMock).toHaveBeenCalledTimes(1);
    });
    expect(createBillingPortalSessionMock).toHaveBeenCalledWith({
      returnUrl: `${window.location.origin}/settings/billing`,
    });
    expect(assignSpy).toHaveBeenCalledWith("https://billing.stripe.com/session/test");
  });
});
