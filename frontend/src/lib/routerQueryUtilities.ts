import { QueryClient } from "@tanstack/react-query";

/**
 * Utility functions for integrating TanStack Query with TanStack Router
 */

/**
 * Ensures query data is available before route renders
 * This is the TanStack Query equivalent of route loaders
 */
export function ensureQueryData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFunction: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
  },
): Promise<T> {
  return queryClient.ensureQueryData({
    queryKey,
    queryFn: queryFunction,
    ...options,
  });
}

/**
 * Prefetches query data without waiting for it
 * Useful for optimistic data loading
 */
export function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFunction: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
  },
): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn: queryFunction,
    ...options,
  });
}

/**
 * Invalidates queries by key pattern
 * Useful for cache invalidation after mutations
 */
export function invalidateQueries(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey,
  });
}

/**
 * Type helper for router context with queryClient
 */
export interface RouterContext {
  queryClient: QueryClient;
}
