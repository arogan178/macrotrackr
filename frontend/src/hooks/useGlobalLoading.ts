import { useIsFetching, useIsMutating } from "@tanstack/react-query";

export function useGlobalLoading() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  return {
    isQueryLoading: isFetching > 0,
    isMutationLoading: isMutating > 0,
    isLoading: isFetching > 0 || isMutating > 0,
    activeQueries: isFetching,
    activeMutations: isMutating,
  };
}

export function useCriticalLoading() {
  const isFetchingCritical = useIsFetching({
    predicate: (query) =>
      query.state.fetchStatus === "fetching" && !query.state.data,
  });

  const isMutating = useIsMutating();

  return {
    isCriticalLoading: isFetchingCritical > 0,
    isMutationLoading: isMutating > 0,
    isLoading: isFetchingCritical > 0 || isMutating > 0,
  };
}
