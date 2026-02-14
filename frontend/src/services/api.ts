import { createApiClient, type ApiClient } from "@/lib/apiClient";
import { env } from "@/config/env";

let activeApiClient: ApiClient = createApiClient(env.apiBase);

export function setApiClient(nextClient: ApiClient) {
  activeApiClient = nextClient;
}

const call =
  <K extends keyof ApiClient>(method: K): ApiClient[K] =>
  ((...args: unknown[]) =>
    (
      activeApiClient[method] as unknown as (...fnArgs: unknown[]) => unknown
    )(...args)) as ApiClient[K];

export const api: ApiClient = {
  createScenario: call("createScenario"),
  createSession: call("createSession"),
  getMyEntitlements: call("getMyEntitlements"),
  createTeamCheckout: call("createTeamCheckout"),
  createBillingPortalSession: call("createBillingPortalSession"),
  createOrganization: call("createOrganization"),
  getCurrentOrganization: call("getCurrentOrganization"),
  listCurrentOrganizationMembers: call("listCurrentOrganizationMembers"),
  getCurrentOrganizationProgress: call("getCurrentOrganizationProgress"),
  createOrganizationInvitation: call("createOrganizationInvitation"),
  acceptOrganizationInvitation: call("acceptOrganizationInvitation"),
  updateCurrentOrganizationMember: call("updateCurrentOrganizationMember"),
  deleteCurrentOrganizationMember: call("deleteCurrentOrganizationMember"),
  listSessions: call("listSessions"),
  getSession: call("getSession"),
  listMessages: call("listMessages"),
  deleteSession: call("deleteSession"),
  postMessage: call("postMessage"),
  evaluate: call("evaluate"),
  listComments: call("listComments"),
  createComment: call("createComment"),
  listOutputs: call("listOutputs"),
  createOutput: call("createOutput"),
  deleteOutput: call("deleteOutput"),
  listTestCases: call("listTestCases"),
  createTestCase: call("createTestCase"),
  deleteTestCase: call("deleteTestCase"),
  getProductConfig: call("getProductConfig"),
  updateProductConfig: call("updateProductConfig"),
  resetProductConfig: call("resetProductConfig"),
};
