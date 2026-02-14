import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";

export const useMyAccount = () => {
  return useQuery({
    queryKey: queryKeys.account.detail(),
    queryFn: () => api.getMyAccount(),
    staleTime: 60_000,
  });
};
