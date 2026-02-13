import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth0 } from "@auth0/auth0-react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavBar } from "@/components/NavBar";

const loadLastSessionIdMock = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(),
}));

vi.mock("@/contexts/StorageContext", () => ({
  useStorage: () => ({
    loadLastSessionId: loadLastSessionIdMock,
  }),
}));

const useAuth0Mock = vi.mocked(useAuth0);

describe("NavBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadLastSessionIdMock.mockResolvedValue(null);
    useAuth0Mock.mockReturnValue({
      user: {
        sub: "auth0|navbar-test-user",
        name: "Nav Bar User",
        picture: "https://example.com/avatar.png",
      },
      logout: vi.fn(),
    } as any);
  });

  it("shows pricing link only inside profile menu", async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(loadLastSessionIdMock).toHaveBeenCalled();
    });

    expect(screen.queryByRole("menuitem", { name: "料金" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "プロフィールメニューを開く" }));

    const pricingLink = await screen.findByRole("menuitem", { name: "料金" });
    expect(pricingLink).toBeInTheDocument();
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("keeps billing settings entry in profile menu", async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(loadLastSessionIdMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "プロフィールメニューを開く" }));

    const billingLink = await screen.findByRole("menuitem", { name: "請求設定" });
    expect(billingLink).toBeInTheDocument();
    expect(billingLink).toHaveAttribute("href", "/settings/billing");
  });
});
