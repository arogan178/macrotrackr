import { useIsFetching, useIsMutating } from "@tanstack/react-query";



/**
 * Hook that aggregates loading states from all active queries and mutations
 * Provides a global loading indicator for the entire application
 */
export function useGlobalLoading() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  return {
    /**
     * True if any query is currently fetching
     */
    isQueryLoading: isFetching > 0,

    /**
     * True if any mutation is currently running
     */
    isMutationLoading: isMutating > 0,

    /**
     * True if any query or mutation is active
     */
    isLoading: isFetching > 0 || isMutating > 0,

    /**
     * Number of active queries
     */
    activeQueries: isFetching,

    /**
     * Number of active mutations
     */
    activeMutations: isMutating,
  };
}

/**
 * Hook for checking loading state of critical queries only
 * Excludes background refetches and focuses on user-initiated requests
 */
export function useCriticalLoading() {
  // Check for queries that are fetching for the first time (not background refetch)
  const isFetchingCritical = useIsFetching({
    predicate: (query) =>
      query.state.fetchStatus === "fetching" && !query.state.data,
  });

  const isMutating = useIsMutating();

  return {
    /**
     * True if critical queries are loading (first-time fetch, not background)
     */
    isCriticalLoading: isFetchingCritical > 0,

    /**
     * True if any mutation is running
     */
    isMutationLoading: isMutating > 0,

    /**
     * True if critical operations are running
     */
    isLoading: isFetchingCritical > 0 || isMutating > 0,
  };
}
