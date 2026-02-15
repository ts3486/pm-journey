import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamOnboardingPage } from "@/routes/team/TeamOnboardingPage";
import { env } from "@/config/env";
import { useCurrentOrganization } from "@/queries/organizations";
import { api } from "@/services/api";

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    createOrganization: vi.fn(),
    acceptOrganizationInvitation: vi.fn(),
  },
}));

const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);
const createOrganizationMock = vi.mocked(api.createOrganization);
const acceptOrganizationInvitationMock = vi.mocked(api.acceptOrganizationInvitation);

const mockNoOrganization = () => {
  useCurrentOrganizationMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
  } as any);
};

const mockExistingOrganization = (role: "owner" | "admin" | "manager" | "member" = "owner") => {
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
        id: "org_member_owner",
        organizationId: "org_test",
        userId: "auth0|owner",
        role,
        status: "active",
        createdAt: "2026-02-14T00:00:00Z",
        updatedAt: "2026-02-14T00:00:00Z",
      },
      seatLimit: 5,
      activeMemberCount: 1,
      pendingInvitationCount: 0,
    },
    isLoading: false,
    error: null,
  } as any);
};

const renderPage = (initialEntry = "/team/onboarding") => {
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
        <TeamOnboardingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("TeamOnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNoOrganization();
  });

  it("creates a team from onboarding form", async () => {
    createOrganizationMock.mockResolvedValue({
      id: "org_new",
      name: "Team Ops",
      createdByUserId: "auth0|owner",
      createdAt: "2026-02-14T00:00:00Z",
      updatedAt: "2026-02-14T00:00:00Z",
    });
    renderPage();

    fireEvent.change(screen.getByLabelText("チーム名"), {
      target: { value: " Team Ops " },
    });
    fireEvent.click(screen.getByRole("button", { name: "チームを作成する" }));

    await waitFor(() => {
      expect(createOrganizationMock).toHaveBeenCalledTimes(1);
    });
    expect(createOrganizationMock).toHaveBeenCalledWith({ name: "Team Ops" });
  });

  it("accepts invitation token prefilled from query string", async () => {
    acceptOrganizationInvitationMock.mockResolvedValue({
      organization: {
        id: "org_joined",
        name: "Joined Org",
        createdByUserId: "auth0|owner",
        createdAt: "2026-02-14T00:00:00Z",
        updatedAt: "2026-02-14T00:00:00Z",
      },
      membership: {
        id: "org_member_joined",
        organizationId: "org_joined",
        userId: "auth0|member",
        role: "member",
        status: "active",
        createdAt: "2026-02-14T00:00:00Z",
        updatedAt: "2026-02-14T00:00:00Z",
      },
      seatLimit: 5,
      activeMemberCount: 2,
      pendingInvitationCount: 0,
    });
    renderPage("/team/onboarding?invite=invite_token_123");

    expect(screen.getByLabelText("招待トークン")).toHaveValue("invite_token_123");
    fireEvent.click(screen.getByRole("button", { name: "招待に参加する" }));

    await waitFor(() => {
      expect(acceptOrganizationInvitationMock).toHaveBeenCalledTimes(1);
    });
    expect(acceptOrganizationInvitationMock).toHaveBeenCalledWith("invite_token_123");
  });

  it("shows dedicated expired invitation messaging", async () => {
    acceptOrganizationInvitationMock.mockRejectedValue(new Error("invitation has expired"));
    renderPage("/team/onboarding?invite=invite_expired");

    fireEvent.click(screen.getByRole("button", { name: "招待に参加する" }));

    expect(await screen.findByText("招待の有効期限が切れています")).toBeInTheDocument();
    expect(screen.getByText("この招待は期限切れです。管理者に再招待を依頼してください。")).toBeInTheDocument();
  });

  it("shows dedicated email mismatch messaging", async () => {
    acceptOrganizationInvitationMock.mockRejectedValue(
      new Error("FORBIDDEN_ROLE: invitation email does not match current user"),
    );
    renderPage("/team/onboarding?invite=invite_mismatch");

    fireEvent.click(screen.getByRole("button", { name: "招待に参加する" }));

    expect(await screen.findByText("招待先メールとログイン中アカウントが不一致です")).toBeInTheDocument();
    expect(screen.getByText("ログイン中のメールアドレスが招待先と一致しません。")).toBeInTheDocument();
  });

  it("locks onboarding actions when already in a team", () => {
    mockExistingOrganization();
    renderPage();

    expect(screen.getByText("すでにチームに参加済みです")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "チームを作成する" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "招待に参加する" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: env.billingEnabled ? "請求設定を開く" : "Team管理を開く" }),
    ).toHaveAttribute("href", env.billingEnabled ? "/settings/billing" : "/settings/team");
  });

  it("shows non-admin members a non-management destination", () => {
    mockExistingOrganization("member");
    renderPage();

    if (env.billingEnabled) {
      expect(screen.getByRole("link", { name: "請求設定を開く" })).toHaveAttribute(
        "href",
        "/settings/billing",
      );
      return;
    }

    expect(screen.getByRole("link", { name: "アカウント情報を開く" })).toHaveAttribute(
      "href",
      "/settings/account",
    );
  });
});
