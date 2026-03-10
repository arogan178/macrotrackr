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
    search: (query: string) => ["macros", "search", query] as const,
    history: (page?: number, limit?: number, startDate?: string, endDate?: string) =>
      startDate || endDate
        ? (["macros", "history", page, limit, startDate, endDate] as const)
        : (["macros", "history", page, limit] as const),
    historyInfinite: (limit?: number, startDate?: string, endDate?: string) =>
      startDate || endDate
        ? (["macros", "history-infinite", limit, startDate, endDate] as const)
        : (["macros", "history-infinite", limit] as const),
    historyRange: (startDate?: string, endDate?: string) =>
      ["macros", "history-range", startDate, endDate] as const,
    dailyTotals: (date: string) => ["macros", "daily-totals", date] as const,
    targets: () => ["macros", "targets"] as const,
  },

  // Settings queries
  settings: {
    all: () => ["settings"] as const,
    user: () => ["settings", "user"] as const,
    billing: () => ["settings", "billing"] as const,
  },

  // Saved meals queries
  savedMeals: {
    all: () => ["saved-meals"] as const,
    list: () => ["saved-meals", "list"] as const,
  },
} as const;

// Type helper for query keys
export type QueryKeys = typeof queryKeys;
