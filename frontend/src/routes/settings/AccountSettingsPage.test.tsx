import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useAuth0 } from "@auth0/auth0-react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountSettingsPage } from "@/routes/settings/AccountSettingsPage";
import { useMyAccount } from "@/queries/account";
import { useCurrentOrganization } from "@/queries/organizations";
import { api } from "@/services/api";

const loadLastScenarioIdMock = vi.fn();
const clearLastSessionPointerMock = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: vi.fn(),
}));

vi.mock("@/queries/account", () => ({
  useMyAccount: vi.fn(),
}));

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    deleteMyAccount: vi.fn(),
  },
}));

vi.mock("@/contexts/StorageContext", () => ({
  useStorage: () => ({
    loadLastScenarioId: loadLastScenarioIdMock,
    clearLastSessionPointer: clearLastSessionPointerMock,
  }),
}));

const useAuth0Mock = vi.mocked(useAuth0);
const useMyAccountMock = vi.mocked(useMyAccount);
const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);
const deleteMyAccountMock = vi.mocked(api.deleteMyAccount);

describe("AccountSettingsPage", () => {
  const logoutMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    loadLastScenarioIdMock.mockResolvedValue(null);
    clearLastSessionPointerMock.mockResolvedValue(undefined);
    deleteMyAccountMock.mockResolvedValue(undefined);

    useAuth0Mock.mockReturnValue({
      user: {
        sub: "auth0|account-user",
        name: "Account User",
        email: "account@example.com",
        picture: "https://example.com/avatar.png",
      },
      logout: logoutMock,
    } as any);

    useMyAccountMock.mockReturnValue({
      data: {
        id: "auth0|account-user",
        name: "Account User",
        email: "account@example.com",
        picture: "https://example.com/avatar.png",
        createdAt: "2026-02-14T10:00:00Z",
        updatedAt: "2026-02-14T12:00:00Z",
      },
      isLoading: false,
      isError: false,
      error: null,
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
          userId: "auth0|account-user",
          role: "manager",
          status: "active",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
        seatLimit: 5,
        activeMemberCount: 2,
        pendingInvitationCount: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it("shows account profile details", () => {
    render(
      <MemoryRouter>
        <AccountSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("現在のユーザー")).toBeInTheDocument();
    expect(screen.getByText("Account User (account@example.com)")).toBeInTheDocument();
    expect(screen.getByText("account@example.com")).toBeInTheDocument();
    expect(screen.getByText("auth0|account-user")).toBeInTheDocument();
    expect(screen.getByText("manager")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
  });

  it("deletes account after confirmation phrase is entered", async () => {
    render(
      <MemoryRouter>
        <AccountSettingsPage />
      </MemoryRouter>,
    );

    const deleteButton = screen.getByRole("button", { name: "アカウントを削除" });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("確認のため「アカウントを削除」と入力してください"), {
      target: { value: "アカウントを削除" },
    });

    expect(deleteButton).toBeEnabled();
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteMyAccountMock).toHaveBeenCalledTimes(1);
    });
    expect(logoutMock).toHaveBeenCalledWith({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  });

  it("shows API error when account deletion fails", async () => {
    deleteMyAccountMock.mockRejectedValue(new Error("アカウント削除に失敗しました"));

    render(
      <MemoryRouter>
        <AccountSettingsPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("確認のため「アカウントを削除」と入力してください"), {
      target: { value: "アカウントを削除" },
    });
    fireEvent.click(screen.getByRole("button", { name: "アカウントを削除" }));

    expect(await screen.findByText("アカウント削除に失敗しました")).toBeInTheDocument();
    expect(logoutMock).not.toHaveBeenCalled();
  });
});
