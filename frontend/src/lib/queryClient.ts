import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered stale after 5 minutes for most queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Data stays in cache for 10 minutes after being unused
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Enhanced retry logic with different strategies for different error types
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors) except for specific cases
        if (error instanceof Error && "status" in error) {
          const status = (error as any).status;

          // Never retry authentication errors
          if (status === 401 || status === 403) {
            return false;
          }

          // Don't retry validation errors and not found
          if (status === 400 || status === 404 || status === 422) {
            return false;
          }

          // Retry rate limiting with longer delays
          if (status === 429) {
            return failureCount < 5;
          }

          // Don't retry other 4xx client errors
          if (status >= 400 && status < 500) {
            return false;
          }

          // Retry server errors (5xx) more aggressively
          if (status >= 500) {
            return failureCount < 5;
          }
        }

        // Network errors - retry with exponential backoff
        if (
          error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("timeout") ||
            error.name === "NetworkError")
        ) {
          return failureCount < 5;
        }

        // Default retry for other errors
        return failureCount < 3;
      },
      // Enhanced exponential backoff with jitter for network resilience
      retryDelay: (attemptIndex, error) => {
        // Base delay with exponential backoff
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30_000);

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * baseDelay;

        // Special handling for rate limiting
        if (
          error instanceof Error &&
          "status" in error &&
          (error as any).status === 429
        ) {
          // Longer delays for rate limiting
          return Math.min(5000 * 2 ** attemptIndex, 60_000) + jitter;
        }

        // Network errors get longer delays
        if (
          error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("timeout") ||
            error.name === "NetworkError")
        ) {
          return Math.min(2000 * 2 ** attemptIndex, 45_000) + jitter;
        }

        return baseDelay + jitter;
      },
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (disabled by default, can be enabled per query)
      refetchInterval: false,
    },
    mutations: {
      // Enhanced mutation retry logic
      retry: (failureCount, error) => {
        // Don't retry authentication errors
        if (error instanceof Error && "status" in error) {
          const status = (error as any).status;

          if (status === 401 || status === 403) {
            return false;
          }

          // Don't retry validation errors
          if (status === 400 || status === 422) {
            return false;
          }

          // Retry rate limiting
          if (status === 429) {
            return failureCount < 3;
          }

          // Retry server errors
          if (status >= 500) {
            return failureCount < 3;
          }

          // Don't retry other client errors
          if (status >= 400 && status < 500) {
            return false;
          }
        }

        // Network errors - retry with backoff
        if (
          error instanceof Error &&
          (error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("timeout") ||
            error.name === "NetworkError")
        ) {
          return failureCount < 3;
        }

        // Default: retry once for other errors
        return failureCount < 1;
      },
      // Enhanced retry delay for mutations with jitter
      retryDelay: (attemptIndex, error) => {
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 15_000);
        const jitter = Math.random() * 0.2 * baseDelay;

        // Special handling for rate limiting
        if (
          error instanceof Error &&
          "status" in error &&
          (error as any).status === 429
        ) {
          return Math.min(3000 * 2 ** attemptIndex, 30_000) + jitter;
        }

        return baseDelay + jitter;
      },
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
