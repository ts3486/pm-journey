import type {
  BillingPortalSessionResponse,
  CreateOrganizationRequest,
  CreateOrganizationInvitationRequest,
  CreateTeamCheckoutRequest,
  CreateBillingPortalSessionRequest,
  CurrentOrganizationResponse,
  EntitlementResponse,
  Evaluation,
  HistoryItem,
  ManagerComment,
  Message,
  MessageRole,
  MessageTag,
  MissionStatus,
  MyAccountResponse,
  OutputSubmission,
  OutputSubmissionType,
  ProductConfig,
  RatingCriterion,
  Scenario,
  Session,
  Organization,
  OrganizationProgressResponse,
  OrganizationMembersResponse,
  InvitationResponse,
  OrganizationMember,
  TeamCheckoutResponse,
  TestCase,
  UpdateOrganizationMemberRequest,
  UpdateProductConfigRequest,
} from "@/types";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export type ApiClient = ReturnType<typeof createApiClient>;

type ApiClientOptions = {
  getAccessToken?: () => Promise<string>;
  onUnauthorized?: () => void;
};

export function createApiClient(baseUrl: string, clientOptions: ApiClientOptions = {}) {
  async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    if (!baseUrl) {
      throw new Error("API base not configured");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (clientOptions.getAccessToken) {
      try {
        const token = await clientOptions.getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get access token:", error);
      }
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      if (res.status === 401) {
        clientOptions.onUnauthorized?.();
        throw new Error("認証の有効期限が切れました。再ログインしてください。");
      }
      const rawText = await res.text();
      let detail = rawText;
      try {
        const parsed = rawText ? JSON.parse(rawText) : null;
        if (parsed && typeof parsed.error === "string") {
          detail = parsed.error;
        }
      } catch {
        // ignore JSON parse failures
      }
      const formatError = (status: number, message: string) => {
        const retrySecondsMatch =
          message.match(/retryDelay"?:\s*"(\d+)s"/) ?? message.match(/retry in ([0-9.]+)s/i);
        const retrySeconds = retrySecondsMatch ? Number(retrySecondsMatch[1]) : null;
        if (/PLAN_REQUIRED/i.test(message)) {
          return "このシナリオは現在のプランでは利用できません。プランをアップグレードしてください。";
        }
        if (/FAIR_USE_LIMIT_REACHED/i.test(message)) {
          return "本日のフェアユース上限に達しました。時間をおいて再試行してください。";
        }
        if (/CREDIT_DAILY_LIMIT/i.test(message)) {
          return "本日のAIレビュー上限に達しました。明日再試行するか、プランを見直してください。";
        }
        if (/CREDIT_EXHAUSTED/i.test(message)) {
          return "AIレビュークレジットが不足しています。クレジット購入またはプラン変更をご検討ください。";
        }
        if (status === 429 || /RESOURCE_EXHAUSTED|Quota exceeded|Too Many Requests/i.test(message)) {
          return `Gemini APIの利用上限に達しました。${
            retrySeconds ? `${retrySeconds}秒後に再試行してください。` : "時間をおいて再試行してください。"
          }`;
        }
        if (/GEMINI_API_KEY is not set/i.test(message)) {
          return "Gemini APIキーが未設定です。backend/.env の GEMINI_API_KEY を設定してください。";
        }
        if (/evaluation returned invalid JSON/i.test(message)) {
          return "評価結果の生成に失敗しました（AI出力が不正な形式でした）。時間をおいて再試行してください。";
        }
        if (message && message.length < 300) {
          return message;
        }
        return `Request failed: ${status}`;
      };
      throw new Error(formatError(res.status, detail));
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  return {
    async listScenarios(): Promise<Scenario[]> {
      return request<Scenario[]>("/scenarios");
    },
    async getScenario(id: string): Promise<Scenario> {
      return request<Scenario>(`/scenarios/${encodeURIComponent(id)}`);
    },
    async createScenario(payload: Scenario): Promise<Scenario> {
      return request<Scenario>("/scenarios", { method: "POST", body: payload });
    },
    async createSession(scenarioId: string): Promise<Session> {
      return request<Session>("/sessions", { method: "POST", body: { scenarioId } });
    },
    async getMyAccount(): Promise<MyAccountResponse> {
      return request<MyAccountResponse>("/me");
    },
    async deleteMyAccount(): Promise<void> {
      await request("/me", { method: "DELETE" });
    },
    async getMyEntitlements(): Promise<EntitlementResponse> {
      return request<EntitlementResponse>("/me/entitlements");
    },
    async createTeamCheckout(payload: CreateTeamCheckoutRequest): Promise<TeamCheckoutResponse> {
      return request<TeamCheckoutResponse>("/billing/checkout/team", {
        method: "POST",
        body: payload,
      });
    },
    async createBillingPortalSession(
      payload: CreateBillingPortalSessionRequest = {}
    ): Promise<BillingPortalSessionResponse> {
      return request<BillingPortalSessionResponse>("/billing/portal/session", {
        method: "POST",
        body: payload,
      });
    },
    async createOrganization(payload: CreateOrganizationRequest): Promise<Organization> {
      return request<Organization>("/organizations", {
        method: "POST",
        body: payload,
      });
    },
    async getCurrentOrganization(): Promise<CurrentOrganizationResponse> {
      return request<CurrentOrganizationResponse>("/organizations/current");
    },
    async listCurrentOrganizationMembers(): Promise<OrganizationMembersResponse> {
      return request<OrganizationMembersResponse>("/organizations/current/members");
    },
    async getCurrentOrganizationProgress(): Promise<OrganizationProgressResponse> {
      return request<OrganizationProgressResponse>("/organizations/current/progress");
    },
    async listCurrentOrganizationMemberCompletedSessions(memberId: string): Promise<HistoryItem[]> {
      return request<HistoryItem[]>(`/organizations/current/members/${memberId}/sessions/completed`);
    },
    async createOrganizationInvitation(
      payload: CreateOrganizationInvitationRequest
    ): Promise<InvitationResponse> {
      return request<InvitationResponse>("/organizations/current/invitations", {
        method: "POST",
        body: payload,
      });
    },
    async acceptOrganizationInvitation(token: string): Promise<CurrentOrganizationResponse> {
      return request<CurrentOrganizationResponse>(`/organizations/current/invitations/${token}/accept`, {
        method: "POST",
      });
    },
    async updateCurrentOrganizationMember(
      memberId: string,
      payload: UpdateOrganizationMemberRequest
    ): Promise<OrganizationMember> {
      return request<OrganizationMember>(`/organizations/current/members/${memberId}`, {
        method: "PATCH",
        body: payload,
      });
    },
    async deleteCurrentOrganizationMember(memberId: string): Promise<void> {
      await request(`/organizations/current/members/${memberId}`, { method: "DELETE" });
    },
    async listSessions(): Promise<HistoryItem[]> {
      return request<HistoryItem[]>("/sessions");
    },
    async getSession(id: string): Promise<HistoryItem> {
      return request<HistoryItem>(`/sessions/${id}`);
    },
    async listMessages(sessionId: string): Promise<Message[]> {
      return request<Message[]>(`/sessions/${sessionId}/messages`);
    },
    async deleteSession(id: string): Promise<void> {
      await request(`/sessions/${id}`, { method: "DELETE" });
    },
    async postMessage(
      sessionId: string,
      role: MessageRole,
      content: string,
      tags?: MessageTag[],
      missionStatus?: MissionStatus[],
    ): Promise<{ reply: Message; additionalMessages: Message[]; session: Session }> {
      return request<{ reply: Message; additionalMessages: Message[]; session: Session }>(`/sessions/${sessionId}/messages`, {
        method: "POST",
        body: { role, content, tags, missionStatus },
      });
    },
    async evaluate(
      sessionId: string,
      payload?: {
        criteria: RatingCriterion[];
        passingScore?: number;
        scenarioTitle?: string;
        scenarioDescription?: string;
        productContext?: string;
        scenarioPrompt?: string;
        scenarioType?: string;
        testCasesContext?: string;
      }
    ): Promise<Evaluation> {
      return request<Evaluation>(`/sessions/${sessionId}/evaluate`, {
        method: "POST",
        body: payload,
      });
    },
    async listComments(sessionId: string): Promise<ManagerComment[]> {
      return request<ManagerComment[]>(`/sessions/${sessionId}/comments`);
    },
    async createComment(
      sessionId: string,
      payload: { content: string; authorName?: string }
    ): Promise<ManagerComment> {
      return request<ManagerComment>(`/sessions/${sessionId}/comments`, {
        method: "POST",
        body: payload,
      });
    },
    async listOutputs(sessionId: string): Promise<OutputSubmission[]> {
      return request<OutputSubmission[]>(`/sessions/${sessionId}/outputs`);
    },
    async createOutput(
      sessionId: string,
      payload: { kind: OutputSubmissionType; value: string; note?: string }
    ): Promise<OutputSubmission> {
      return request<OutputSubmission>(`/sessions/${sessionId}/outputs`, {
        method: "POST",
        body: payload,
      });
    },
    async deleteOutput(sessionId: string, outputId: string): Promise<void> {
      await request(`/sessions/${sessionId}/outputs/${outputId}`, { method: "DELETE" });
    },
    async listTestCases(sessionId: string): Promise<TestCase[]> {
      return request<TestCase[]>(`/sessions/${sessionId}/test-cases`);
    },
    async createTestCase(
      sessionId: string,
      payload: {
        name: string;
        preconditions: string;
        steps: string;
        expectedResult: string;
      }
    ): Promise<TestCase> {
      return request<TestCase>(`/sessions/${sessionId}/test-cases`, {
        method: "POST",
        body: payload,
      });
    },
    async deleteTestCase(id: string): Promise<void> {
      await request(`/test-cases/${id}`, { method: "DELETE" });
    },
    async getProductConfig(): Promise<ProductConfig> {
      return request<ProductConfig>("/product-config");
    },
    async updateProductConfig(payload: UpdateProductConfigRequest): Promise<ProductConfig> {
      return request<ProductConfig>("/product-config", { method: "PUT", body: payload });
    },
    async resetProductConfig(): Promise<ProductConfig> {
      return request<ProductConfig>("/product-config/reset", { method: "POST" });
    },
  };
}
