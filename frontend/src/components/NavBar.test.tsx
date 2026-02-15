import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth0 } from "@auth0/auth0-react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavBar } from "@/components/NavBar";
import { env } from "@/config/env";
import { useCurrentOrganization } from "@/queries/organizations";

const loadLastSessionIdMock = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(),
}));

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
}));

vi.mock("@/contexts/StorageContext", () => ({
  useStorage: () => ({
    loadLastSessionId: loadLastSessionIdMock,
  }),
}));

const useAuth0Mock = vi.mocked(useAuth0);
const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);

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
          id: "org_member_manager",
          organizationId: "org_test",
          userId: "auth0|manager",
          role: "manager",
          status: "active",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
        seatLimit: 10,
        activeMemberCount: 2,
        pendingInvitationCount: 0,
      },
      isLoading: false,
      error: null,
    } as any);
  });

  it("shows team management button in header for manager role", async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(loadLastSessionIdMock).toHaveBeenCalled();
    });

    expect(screen.getByRole("link", { name: "チーム管理" })).toHaveAttribute("href", "/settings/team");
  });

  it("hides team management button for non-manager role", async () => {
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
          id: "org_member_member",
          organizationId: "org_test",
          userId: "auth0|member",
          role: "member",
          status: "active",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
        seatLimit: 10,
        activeMemberCount: 2,
        pendingInvitationCount: 0,
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(loadLastSessionIdMock).toHaveBeenCalled();
    });

    expect(screen.queryByRole("link", { name: "チーム管理" })).not.toBeInTheDocument();
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

    if (env.billingEnabled) {
      const pricingLink = await screen.findByRole("menuitem", { name: "料金" });
      expect(pricingLink).toBeInTheDocument();
      expect(pricingLink).toHaveAttribute("href", "/pricing");
      return;
    }

    expect(screen.queryByRole("menuitem", { name: "料金" })).not.toBeInTheDocument();
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

    if (env.billingEnabled) {
      const billingLink = await screen.findByRole("menuitem", { name: "請求設定" });
      expect(billingLink).toBeInTheDocument();
      expect(billingLink).toHaveAttribute("href", "/settings/billing");
      return;
    }

    expect(screen.queryByRole("menuitem", { name: "請求設定" })).not.toBeInTheDocument();
  });

  it("shows account settings entry in profile menu", async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(loadLastSessionIdMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "プロフィールメニューを開く" }));

    const accountLink = await screen.findByRole("menuitem", { name: "アカウント情報" });
    expect(accountLink).toBeInTheDocument();
    expect(accountLink).toHaveAttribute("href", "/settings/account");
  });
});
