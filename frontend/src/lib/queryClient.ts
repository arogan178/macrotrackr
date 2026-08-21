import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

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

export const localStoragePersister = createAsyncStoragePersister({
  storage: globalThis.localStorage,
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

// Health data (macro logs, goals, habits) is sensitive under Play's data
// policy — keep it out of plaintext localStorage entirely.
export const doNotPersistKeys = [
  ["auth"],
  ["settings", "user"],
  ["settings", "billing"],
  ["habits"],
  ["goals"],
  ["macros"],
  ["saved-meals"],
] as const;

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  return !doNotPersistKeys.some(
    (prefix) =>
      queryKey[0] === prefix[0] &&
      (prefix.length < 2 || queryKey[1] === prefix[1]),
  );
}
