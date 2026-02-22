import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

/**
 * Error type that includes HTTP status code
 * Used for API errors that have a status property
 */
export interface ErrorWithStatus extends Error {
  status: number;
}

/**
 * Type guard to check if an error has a status property
 */
export function hasStatus(error: Error): error is ErrorWithStatus {
  return "status" in error && typeof (error as ErrorWithStatus).status === "number";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes - reduces unnecessary refetches
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Keep unused data in cache for 30 minutes - improves navigation performance
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      // Reduce retries for faster failure - prevents hanging UI
      retry: 1,
      // Don't refetch on window focus - prevents unnecessary API calls when switching tabs
      refetchOnWindowFocus: false,
      // Refetch on network reconnect - ensures fresh data after connectivity issues
      refetchOnReconnect: true,
      // Background refetch interval (disabled by default, can be enabled per query)
      refetchInterval: false,
    },
    mutations: {
      // Don't retry mutations - mutations should be explicit user actions
      // Users can manually retry if needed
      retry: 0,
    },
  },
});

/**
 * Query-specific configurations
 * These can be used to override defaults for specific query types
 */
export const queryConfigs = {
  // Auth queries - shorter stale time for security, less frequent background refetch
  auth: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
    refetchOnWindowFocus: true, // Refetch on window focus for auth
    refetchOnReconnect: true,
  },

  // Habits, goals, settings - longer stale time, moderate background refetch
  longLived: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Background refetch every 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus for less critical data
    refetchOnReconnect: true,
  },

  // Macro data - shorter stale time for more frequent updates, frequent background refetch
  macros: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 3 * 60 * 1000, // Background refetch every 3 minutes
    refetchOnWindowFocus: true, // Refetch on focus for frequently changing data
    refetchOnReconnect: true,
  },

  // Real-time data - very short stale time, very frequent background refetch
  realTime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 1 * 60 * 1000, // Background refetch every minute
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;

/**
 * Storage persister for caching query data in localStorage
 * This enables:
 * - Instant page loads on revisit (data restored from storage)
 * - Offline support
 * - Reduced API calls
 */
export const localStoragePersister = createAsyncStoragePersister({
  storage: globalThis.localStorage,
  key: "macro-tracker-query-cache",
  // Don't persist mutations - only queries
  // Serialize/deserialize for storage
  serialize: (data: PersistedClient) => JSON.stringify(data),
  deserialize: (data: string) => JSON.parse(data) as PersistedClient,
});

/**
 * Query keys that should NOT be persisted
 * - Auth data (security)
 * - User settings (might have sensitive info)
 * - Real-time data that should always be fresh
 */
export const doNotPersistKeys = [
  ["auth"],
  ["settings", "user"],
  ["settings", "billing"],
] as const;
