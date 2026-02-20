export const queryKeys = {
  scenarios: {
    all: () => ["scenarios"] as const,
    detail: (id: string) => ["scenarios", id] as const,
  },
  account: {
    detail: () => ["account", "detail"] as const,
  },
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
    completedSessions: (memberId: string) =>
      ["organizations", "members", memberId, "completedSessions"] as const,
  },
} as const;
