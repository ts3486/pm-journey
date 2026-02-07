import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";
import type { ProductConfig, UpdateProductConfigRequest } from "@/types";

export const useProductConfig = () => {
  return useQuery({
    queryKey: queryKeys.productConfig.detail(),
    queryFn: () => api.getProductConfig(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProductConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductConfigRequest) => api.updateProductConfig(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<ProductConfig>(queryKeys.productConfig.detail(), data);
    },
  });
};

export const useResetProductConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetProductConfig(),
    onSuccess: (data) => {
      queryClient.setQueryData<ProductConfig>(queryKeys.productConfig.detail(), data);
    },
  });
};
