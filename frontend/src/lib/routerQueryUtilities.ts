import type { QueryClient } from "@tanstack/react-query";

export function ensureQueryData<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFunction: () => Promise<T>,
  options?: { staleTime?: number; gcTime?: number },
): Promise<T> {
  return queryClient.ensureQueryData({ queryKey, queryFn: queryFunction, ...options });
}

export function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFunction: () => Promise<T>,
  options?: { staleTime?: number; gcTime?: number },
): Promise<void> {
  return queryClient.prefetchQuery({ queryKey, queryFn: queryFunction, ...options });
}

export function invalidateQueries(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey });
}

export interface RouterContext {
  queryClient: QueryClient;
}
