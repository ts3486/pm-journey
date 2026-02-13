import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";

export const useEntitlements = () => {
  return useQuery({
    queryKey: queryKeys.entitlements.detail(),
    queryFn: () => api.getMyEntitlements(),
    staleTime: 60_000,
  });
};
