import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";
import type { ProductConfig, UpdateProductConfigRequest } from "@pm-journey/types";

/**
 * Hook to fetch the current product configuration
 */
export const useProductConfig = () => {
  return useQuery({
    queryKey: queryKeys.productConfig.detail(),
    queryFn: () => api.getProductConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update the product configuration
 */
export const useUpdateProductConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductConfigRequest) => api.updateProductConfig(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<ProductConfig>(queryKeys.productConfig.detail(), data);
    },
  });
};

/**
 * Hook to reset product configuration to default
 */
export const useResetProductConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetProductConfig(),
    onSuccess: (data) => {
      queryClient.setQueryData<ProductConfig>(queryKeys.productConfig.detail(), data);
    },
  });
};
