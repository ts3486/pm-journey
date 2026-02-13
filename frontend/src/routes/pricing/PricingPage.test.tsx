import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkoutNavigator, PricingPage } from "@/routes/pricing/PricingPage";
import type { PlanCode } from "@/types";
import { useEntitlements } from "@/queries/entitlements";
import { api } from "@/services/api";

vi.mock("@/queries/entitlements", () => ({
  useEntitlements: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    createIndividualCheckout: vi.fn(),
  },
}));

const useEntitlementsMock = vi.mocked(useEntitlements);
const createIndividualCheckoutMock = vi.mocked(api.createIndividualCheckout);

function mockEntitlements(planCode: PlanCode) {
  useEntitlementsMock.mockReturnValue({
    data: {
      planCode,
      monthlyCredits: 0,
      teamFeatures: false,
    },
    isLoading: false,
  } as any);
}

describe("PricingPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("starts checkout and redirects for free users", async () => {
    mockEntitlements("FREE");
    createIndividualCheckoutMock.mockResolvedValue({
      mode: "mock",
      checkoutUrl: "https://billing.example/checkout",
      alreadyEntitled: false,
      message: "CHECKOUT_SESSION_CREATED",
    });
    const assignSpy = vi.spyOn(checkoutNavigator, "assign").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/pricing"]}>
        <PricingPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Individualを開始" }));

    await waitFor(() => {
      expect(createIndividualCheckoutMock).toHaveBeenCalledTimes(1);
    });
    expect(createIndividualCheckoutMock).toHaveBeenCalledWith({
      successUrl: `${window.location.origin}/pricing?checkout=success`,
      cancelUrl: `${window.location.origin}/pricing?checkout=cancel`,
    });
    expect(assignSpy).toHaveBeenCalledWith("https://billing.example/checkout");

  });

  it("shows already-entitled message without redirect", async () => {
    mockEntitlements("FREE");
    createIndividualCheckoutMock.mockResolvedValue({
      mode: "none",
      checkoutUrl: null,
      alreadyEntitled: true,
      message: "ALREADY_ENTITLED",
    });
    const assignSpy = vi.spyOn(checkoutNavigator, "assign").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/pricing"]}>
        <PricingPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Individualを開始" }));

    expect(await screen.findByText("すでにIndividual以上のプランが有効です。")).toBeInTheDocument();
    expect(assignSpy).not.toHaveBeenCalled();

  });

  it("keeps checkout button disabled when current plan is individual", () => {
    mockEntitlements("INDIVIDUAL");

    render(
      <MemoryRouter initialEntries={["/pricing"]}>
        <PricingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "利用中" })).toBeDisabled();
    expect(createIndividualCheckoutMock).not.toHaveBeenCalled();
  });

  it("shows checkout error message on API failure", async () => {
    mockEntitlements("FREE");
    createIndividualCheckoutMock.mockRejectedValue(new Error("checkout failed"));
    const assignSpy = vi.spyOn(checkoutNavigator, "assign").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/pricing"]}>
        <PricingPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Individualを開始" }));

    expect(await screen.findByText("checkout failed")).toBeInTheDocument();
    expect(assignSpy).not.toHaveBeenCalled();

  });
});
