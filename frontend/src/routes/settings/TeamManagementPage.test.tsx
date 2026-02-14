import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamManagementPage } from "@/routes/settings/TeamManagementPage";
import type { PlanCode } from "@/types";
import { useEntitlements } from "@/queries/entitlements";
import {
  useCurrentOrganization,
  useCurrentOrganizationMembers,
  useCurrentOrganizationProgress,
} from "@/queries/organizations";
import { api } from "@/services/api";

vi.mock("@/queries/entitlements", () => ({
  useEntitlements: vi.fn(),
}));

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
  useCurrentOrganizationMembers: vi.fn(),
  useCurrentOrganizationProgress: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    createOrganizationInvitation: vi.fn(),
    updateCurrentOrganizationMember: vi.fn(),
    deleteCurrentOrganizationMember: vi.fn(),
  },
}));

const useEntitlementsMock = vi.mocked(useEntitlements);
const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);
const useCurrentOrganizationMembersMock = vi.mocked(useCurrentOrganizationMembers);
const useCurrentOrganizationProgressMock = vi.mocked(useCurrentOrganizationProgress);
const createOrganizationInvitationMock = vi.mocked(api.createOrganizationInvitation);
const updateCurrentOrganizationMemberMock = vi.mocked(api.updateCurrentOrganizationMember);
const deleteCurrentOrganizationMemberMock = vi.mocked(api.deleteCurrentOrganizationMember);

const refetchCurrentOrganizationMock = vi.fn().mockResolvedValue({});
const refetchMembersMock = vi.fn().mockResolvedValue({});
const refetchProgressMock = vi.fn().mockResolvedValue({});

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
        userId: "auth0|manager",
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
    refetch: refetchCurrentOrganizationMock,
  } as any);
}

function mockNoOrganization() {
  useCurrentOrganizationMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: refetchCurrentOrganizationMock,
  } as any);
}

function mockOrganizationMembers() {
  useCurrentOrganizationMembersMock.mockReturnValue({
    data: {
      members: [
        {
          id: "member_owner",
          organizationId: "org_test",
          userId: "auth0|owner",
          role: "owner",
          status: "active",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
        {
          id: "member_manager",
          organizationId: "org_test",
          userId: "auth0|manager",
          role: "manager",
          status: "active",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
      ],
      seatLimit: 5,
      activeMemberCount: 2,
      pendingInvitationCount: 1,
    },
    isLoading: false,
    error: null,
    refetch: refetchMembersMock,
  } as any);
}

function mockOrganizationProgress() {
  useCurrentOrganizationProgressMock.mockReturnValue({
    data: {
      members: [
        {
          memberId: "member_owner",
          userId: "auth0|owner",
          email: "owner@example.com",
          name: "Owner",
          role: "owner",
          status: "active",
          totalSessions: 3,
          activeSessions: 1,
          completedSessions: 2,
          evaluatedSessions: 2,
          progressItemCompletions: 8,
          lastActivityAt: "2026-02-14T12:00:00Z",
        },
      ],
      generatedAt: "2026-02-14T12:00:00Z",
    },
    isLoading: false,
    error: null,
    refetch: refetchProgressMock,
  } as any);
}

describe("TeamManagementPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    refetchCurrentOrganizationMock.mockClear();
    refetchMembersMock.mockClear();
    refetchProgressMock.mockClear();
    mockCurrentOrganization("manager");
    mockOrganizationMembers();
    mockOrganizationProgress();
  });

  it("redirects free plan users to billing page", () => {
    mockEntitlements("FREE");

    render(
      <MemoryRouter initialEntries={["/settings/team"]}>
        <Routes>
          <Route path="/settings/team" element={<TeamManagementPage />} />
          <Route path="/settings/billing" element={<p>billing-page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("billing-page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "招待を作成" })).not.toBeInTheDocument();
  });

  it("shows team member usage and creates invitation", async () => {
    mockEntitlements("TEAM");
    createOrganizationInvitationMock.mockResolvedValue({
      invitation: {
        id: "invitation_1",
        organizationId: "org_test",
        email: "invitee@example.com",
        role: "member",
        inviteTokenHash: "token_hash",
        expiresAt: "2026-02-21T00:00:00Z",
        status: "pending",
        createdByUserId: "auth0|manager",
        createdAt: "2026-02-14T00:00:00Z",
      },
      inviteToken: "invite_token_abc",
      inviteLink: "https://app.example/team/onboarding?invite=invite_token_abc",
      emailDelivery: {
        status: "sent",
        message: "INVITATION_EMAIL_SENT",
      },
    });

    render(
      <MemoryRouter>
        <TeamManagementPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("メンバー利用: 3 / 5（active 2 + pending 1）")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("メールアドレス"), {
      target: { value: "invitee@example.com" },
    });
    fireEvent.change(screen.getByLabelText("ロール"), {
      target: { value: "member" },
    });
    fireEvent.click(screen.getByRole("button", { name: "招待を作成" }));

    await waitFor(() => {
      expect(createOrganizationInvitationMock).toHaveBeenCalledTimes(1);
    });
    expect(createOrganizationInvitationMock).toHaveBeenCalledWith({
      email: "invitee@example.com",
      role: "member",
    });
    expect(await screen.findByText(/https:\/\/app\.example\/team\/onboarding\?invite=invite_token_abc/)).toBeInTheDocument();
  });

  it("disables team management actions for non-manager role", () => {
    mockEntitlements("TEAM");
    mockCurrentOrganization("member");

    render(
      <MemoryRouter>
        <TeamManagementPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("閲覧のみ可能です。Team管理操作は owner / admin / manager に限定されています。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "招待を作成" })).toBeDisabled();
  });

  it("updates a member role from team management section", async () => {
    mockEntitlements("TEAM");
    updateCurrentOrganizationMemberMock.mockResolvedValue({
      id: "member_manager",
      organizationId: "org_test",
      userId: "auth0|manager",
      role: "admin",
      status: "active",
      createdAt: "2026-02-14T00:00:00Z",
      updatedAt: "2026-02-14T00:00:00Z",
    });

    render(
      <MemoryRouter>
        <TeamManagementPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("role-member_manager"), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "ロール更新" })[1]);

    await waitFor(() => {
      expect(updateCurrentOrganizationMemberMock).toHaveBeenCalledTimes(1);
    });
    expect(updateCurrentOrganizationMemberMock).toHaveBeenCalledWith("member_manager", {
      role: "admin",
    });
    expect(await screen.findByText("メンバー auth0|manager のロールを更新しました。")).toBeInTheDocument();
  });

  it("deletes a member from team management section", async () => {
    mockEntitlements("TEAM");
    deleteCurrentOrganizationMemberMock.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <TeamManagementPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "メンバー削除" })[1]);

    await waitFor(() => {
      expect(deleteCurrentOrganizationMemberMock).toHaveBeenCalledTimes(1);
    });
    expect(deleteCurrentOrganizationMemberMock).toHaveBeenCalledWith("member_manager");
    expect(await screen.findByText("メンバー auth0|manager を削除しました。")).toBeInTheDocument();
  });

  it("shows onboarding entry when no organization is found", () => {
    mockEntitlements("TEAM");
    mockNoOrganization();
    useCurrentOrganizationMembersMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: refetchMembersMock,
    } as any);
    useCurrentOrganizationProgressMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: refetchProgressMock,
    } as any);

    render(
      <MemoryRouter>
        <TeamManagementPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("組織に未参加のため、Team管理は利用できません。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "組織を作成 / 招待に参加" })).toHaveAttribute(
      "href",
      "/team/onboarding",
    );
  });
});
