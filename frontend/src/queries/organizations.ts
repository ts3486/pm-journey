import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";

export const useCurrentOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organizations.current(),
    queryFn: () => api.getCurrentOrganization(),
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
