export const queryKeys = {
  history: {
    list: () => ["history"] as const,
    detail: (sessionId: string) => ["history", sessionId] as const,
  },
  comments: {
    list: (sessionId: string) => ["comments", sessionId] as const,
  },
  outputs: {
    list: (sessionId: string) => ["outputs", sessionId] as const,
  },
  testCases: {
    list: (sessionId: string) => ["testCases", sessionId] as const,
  },
  productConfig: {
    detail: () => ["productConfig"] as const,
  },
};
