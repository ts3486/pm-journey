import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamMemberCompletedSessionsPage } from "@/routes/settings/TeamMemberCompletedSessionsPage";
import {
  useCurrentOrganization,
  useCurrentOrganizationMemberCompletedSessions,
  useCurrentOrganizationProgress,
} from "@/queries/organizations";

vi.mock("@/queries/organizations", () => ({
  useCurrentOrganization: vi.fn(),
  useCurrentOrganizationProgress: vi.fn(),
  useCurrentOrganizationMemberCompletedSessions: vi.fn(),
}));

vi.mock("@/queries/scenarios", () => ({
  useScenarios: () => ({ data: [], isLoading: false }),
  findScenarioById: () => undefined,
}));

const useCurrentOrganizationMock = vi.mocked(useCurrentOrganization);
const useCurrentOrganizationProgressMock = vi.mocked(useCurrentOrganizationProgress);
const useCurrentOrganizationMemberCompletedSessionsMock = vi.mocked(
  useCurrentOrganizationMemberCompletedSessions,
);

describe("TeamMemberCompletedSessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useCurrentOrganizationMock.mockReturnValue({
      data: {
        organization: {
          id: "org_1",
          name: "Team Alpha",
          createdByUserId: "auth0|owner",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
        membership: {
          id: "org_member_admin",
          organizationId: "org_1",
          userId: "auth0|admin",
          userName: "Admin User",
          userEmail: "admin@example.com",
          role: "admin",
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

    useCurrentOrganizationProgressMock.mockReturnValue({
      data: {
        members: [
          {
            memberId: "member_1",
            userId: "auth0|member_1",
            email: "member1@example.com",
            name: "Member One",
            role: "member",
            status: "active",
            totalSessions: 3,
            activeSessions: 1,
            completedSessions: 2,
            evaluatedSessions: 2,
            progressItemCompletions: 5,
            lastActivityAt: "2026-02-14T12:00:00Z",
          },
        ],
        generatedAt: "2026-02-14T12:00:00Z",
      },
      isLoading: false,
    } as any);

    useCurrentOrganizationMemberCompletedSessionsMock.mockReturnValue({
      data: [
        {
          sessionId: "session_completed_1",
          scenarioId: "unknown_scenario",
          scenarioDiscipline: "BASIC",
          metadata: {
            startedAt: "2026-02-14T10:00:00Z",
            messageCount: 5,
          },
          actions: [],
          evaluation: {
            id: "evaluation_1",
            sessionId: "session_completed_1",
            overallScore: 82,
            summary: "summary",
            improvementAdvice: "advice",
            categories: [],
            createdAt: "2026-02-14T11:00:00Z",
          },
          comments: [],
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("shows completed sessions and links to session detail", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/settings/team/members/member_1/completed"]}>
          <Routes>
            <Route
              path="/settings/team/members/:memberId/completed"
              element={<TeamMemberCompletedSessionsPage />}
            />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    );

    expect(screen.getByText("完了シナリオ詳細")).toBeInTheDocument();
    expect(screen.getByText("Member One")).toBeInTheDocument();
    expect(screen.getByText("unknown_scenario")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "セッション詳細を開く" })).toHaveAttribute(
      "href",
      "/history/session_completed_1",
    );
  });

  it("redirects non-admin members away from team member detail page", () => {
    useCurrentOrganizationMock.mockReturnValue({
      data: {
        organization: {
          id: "org_1",
          name: "Team Alpha",
          createdByUserId: "auth0|owner",
          createdAt: "2026-02-14T00:00:00Z",
          updatedAt: "2026-02-14T00:00:00Z",
        },
        membership: {
          id: "org_member_member",
          organizationId: "org_1",
          userId: "auth0|member",
          userName: "Member User",
          userEmail: "member@example.com",
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

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MemoryRouter initialEntries={["/settings/team/members/member_1/completed"]}>
          <Routes>
            <Route
              path="/settings/team/members/:memberId/completed"
              element={<TeamMemberCompletedSessionsPage />}
            />
            <Route path="/settings/account" element={<p>account-page</p>} />
          </Routes>
        </MemoryRouter>
      </Wrapper>,
    );

    expect(screen.getByText("account-page")).toBeInTheDocument();
  });
});
