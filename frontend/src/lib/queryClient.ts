import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

import { createIndexedDatabaseStorage as createIndexedDatabaseStorage } from "./indexedDatabaseStorage";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

export interface ErrorWithStatus extends Error {
  status: number;
}

export function hasStatus(error: Error): error is ErrorWithStatus {
  return "status" in error && typeof (error as ErrorWithStatus).status === "number";
}

const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30 * SECOND,
      gcTime: 30 * MINUTE,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 0,
    },
  },
};

export function createAppQueryClient(overrides: QueryClientConfig = {}): QueryClient {
  return new QueryClient({
    ...defaultQueryClientConfig,
    ...overrides,
    defaultOptions: {
      ...defaultQueryClientConfig.defaultOptions,
      ...overrides.defaultOptions,
      queries: {
        ...defaultQueryClientConfig.defaultOptions?.queries,
        ...overrides.defaultOptions?.queries,
      },
      mutations: {
        ...defaultQueryClientConfig.defaultOptions?.mutations,
        ...overrides.defaultOptions?.mutations,
      },
    },
  });
}

export const queryClient = createAppQueryClient();

export const queryConfigs = {
  auth: {
    staleTime: 30 * SECOND,
    gcTime: 5 * MINUTE,
    refetchInterval: 1 * MINUTE,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  longLived: {
    staleTime: 30 * SECOND,
    gcTime: 10 * MINUTE,
    refetchInterval: 1 * MINUTE,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  macros: {
    staleTime: 10 * SECOND,
    gcTime: 10 * MINUTE,
    refetchInterval: 30 * SECOND,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  realTime: {
    staleTime: 5 * SECOND,
    gcTime: 2 * MINUTE,
    refetchInterval: 15 * SECOND,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;

// Health data stays out of localStorage (Play's data policy). Offline logging
// still needs it on the device, so the cache lives in IndexedDB.
export const queryCachePersister = createAsyncStoragePersister({
  storage: createIndexedDatabaseStorage("macrotrackr-query-cache"),
  key: "macrotrackr-query-cache",
  serialize: (data: PersistedClient) => JSON.stringify(data),
  deserialize: (data: string): PersistedClient => {
    try {
      return JSON.parse(data) as PersistedClient;
    } catch {
      throw new Error("Failed to deserialize query cache");
    }
  },
});

/** Long enough to open the app signed in after a week without signal. */
export const QUERY_CACHE_MAX_AGE = 30 * 24 * 60 * MINUTE;

// Only what opening the app and logging food offline need. Everything else
// is fetched again, so less health data sits on the device.
export const persistedQueryPrefixes = [
  ["auth", "user"],
  ["auth", "session"],
  ["macros", "recent-entries"],
  ["macros", "targets"],
  ["saved-meals", "list"],
  ["goals", "weight"],
] as const;

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  return persistedQueryPrefixes.some(
    ([first, second]) => queryKey[0] === first && queryKey[1] === second,
  );
}
