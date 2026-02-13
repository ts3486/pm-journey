export const queryKeys = {
  productConfig: {
    detail: () => ["productConfig", "detail"] as const,
  },
  entitlements: {
    detail: () => ["entitlements", "detail"] as const,
  },
} as const;
