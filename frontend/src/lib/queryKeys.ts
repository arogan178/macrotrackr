/**
 * Centralized query keys factory for all features
 * This ensures consistent key structure and prevents cache invalidation issues
 */
export const queryKeys = {
  // Authentication queries
  auth: {
    all: () => ["auth"] as const,
    user: () => ["auth", "user"] as const,
  },

  // Habits queries
  habits: {
    all: () => ["habits"] as const,
    list: () => ["habits", "list"] as const,
    byId: (id: string) => ["habits", "detail", id] as const,
  },

  // Goals and weight tracking queries
  goals: {
    all: () => ["goals"] as const,
    weight: () => ["goals", "weight"] as const,
    weightLog: () => ["goals", "weight-log"] as const,
  },

  // Macro tracking queries
  macros: {
    all: () => ["macros"] as const,
    history: (page?: number) => ["macros", "history", page] as const,
    dailyTotals: (date: string) => ["macros", "daily-totals", date] as const,
    targets: () => ["macros", "targets"] as const,
  },

  // Settings queries
  settings: {
    all: () => ["settings"] as const,
    user: () => ["settings", "user"] as const,
    billing: () => ["settings", "billing"] as const,
  },
} as const;

// Type helper for query keys
export type QueryKeys = typeof queryKeys;
