export const queryKeys = {
  productConfig: {
    detail: () => ["productConfig", "detail"] as const,
  },
  entitlements: {
    detail: () => ["entitlements", "detail"] as const,
  },
  organizations: {
    current: () => ["organizations", "current"] as const,
    members: () => ["organizations", "members"] as const,
    progress: () => ["organizations", "progress"] as const,
  },
} as const;
