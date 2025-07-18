import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered stale after 5 minutes for most queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Data stays in cache for 10 minutes after being unused
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests up to 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && "status" in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Exponential backoff delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (disabled by default, can be enabled per query)
      refetchInterval: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

/**
 * Query-specific configurations
 * These can be used to override defaults for specific query types
 */
export const queryConfigs = {
  // Auth queries - shorter stale time for security
  auth: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  // Habits, goals, settings - longer stale time
  longLived: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Macro data - shorter stale time for more frequent updates
  macros: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Real-time data - very short stale time
  realTime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
} as const;
