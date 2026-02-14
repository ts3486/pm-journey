import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamOnboardingPage, teamCheckoutNavigator } from "@/routes/team/TeamOnboardingPage";
import { useCurrentOrganization } from "@/queries/organizations";
import { api } from "@/services/api";

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    createOrganization: vi.fn(),
    acceptOrganizationInvitation: vi.fn(),
    createTeamCheckout: vi.fn(),
  },
}));

const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);
const createOrganizationMock = vi.mocked(api.createOrganization);
const acceptOrganizationInvitationMock = vi.mocked(api.acceptOrganizationInvitation);
const createTeamCheckoutMock = vi.mocked(api.createTeamCheckout);

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

  it("runs team registration flow and proceeds to stripe checkout", async () => {
    createOrganizationMock.mockResolvedValue({
      id: "org_new",
      name: "Team Ops",
      createdByUserId: "auth0|owner",
      createdAt: "2026-02-14T00:00:00Z",
      updatedAt: "2026-02-14T00:00:00Z",
    });
    createTeamCheckoutMock.mockResolvedValue({
      mode: "stripe",
      checkoutUrl: "https://billing.example/team-checkout",
      alreadyEntitled: false,
      message: "CHECKOUT_SESSION_CREATED",
    });
    const assignSpy = vi.spyOn(teamCheckoutNavigator, "assign").mockImplementation(() => {});
    renderPage("/team/onboarding?flow=register");

    fireEvent.change(screen.getByLabelText("チーム名"), { target: { value: "Team Ops" } });
    fireEvent.change(screen.getByLabelText("メンバー数"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "確認画面へ進む" }));

    expect(await screen.findByText("2. 設定内容の確認")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stripeで決済へ進む" }));

    await waitFor(() => {
      expect(createOrganizationMock).toHaveBeenCalledTimes(1);
    });
    expect(createOrganizationMock).toHaveBeenCalledWith({ name: "Team Ops" });
    expect(createTeamCheckoutMock).toHaveBeenCalledWith({
      organizationId: "org_new",
      seatQuantity: 8,
      successUrl: `${window.location.origin}/pricing?checkout=success&plan=team`,
      cancelUrl: `${window.location.origin}/pricing?checkout=cancel&plan=team`,
    });
    expect(assignSpy).toHaveBeenCalledWith("https://billing.example/team-checkout");
  });

  it("blocks team registration checkout for non-manager role in existing organization", () => {
    mockExistingOrganization("member");
    renderPage("/team/onboarding?flow=register");

    expect(screen.getByText("Teamチェックアウトは owner / admin / manager のみ実行できます。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "確認画面へ進む" })).toBeDisabled();
  });

  it("creates an organization from onboarding form", async () => {
    createOrganizationMock.mockResolvedValue({
      id: "org_new",
      name: "Team Ops",
      createdByUserId: "auth0|owner",
      createdAt: "2026-02-14T00:00:00Z",
      updatedAt: "2026-02-14T00:00:00Z",
    });
    renderPage();

    fireEvent.change(screen.getByLabelText("組織名"), {
      target: { value: " Team Ops " },
    });
    fireEvent.click(screen.getByRole("button", { name: "組織を作成する" }));

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

  it("locks onboarding actions when already in an organization", () => {
    mockExistingOrganization();
    renderPage();

    expect(screen.getByText("すでに組織に参加済みです")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "組織を作成する" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "招待に参加する" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "請求設定を開く" })).toHaveAttribute(
      "href",
      "/settings/billing",
    );
  });
});
