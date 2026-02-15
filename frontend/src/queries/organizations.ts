import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";

const isMissingOrganizationError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /organization not found for current user/i.test(error.message);
};

export const useCurrentOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organizations.current(),
    queryFn: async () => {
      try {
        return await api.getCurrentOrganization();
      } catch (error) {
        if (isMissingOrganizationError(error)) {
          return undefined;
        }
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
};

export const useCurrentOrganizationMembers = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.organizations.members(),
    queryFn: () => api.listCurrentOrganizationMembers(),
    enabled,
    staleTime: 15_000,
    retry: false,
  });
};

export const useCurrentOrganizationProgress = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.organizations.progress(),
    queryFn: () => api.getCurrentOrganizationProgress(),
    enabled,
    staleTime: 15_000,
    retry: false,
  });
};

export const useCurrentOrganizationMemberCompletedSessions = (
  memberId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.organizations.completedSessions(memberId),
    queryFn: () => api.listCurrentOrganizationMemberCompletedSessions(memberId),
    enabled: enabled && Boolean(memberId),
    staleTime: 15_000,
    retry: false,
  });
};
