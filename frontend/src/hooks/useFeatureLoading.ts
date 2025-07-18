import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";

export type FeatureType = "auth" | "habits" | "goals" | "macros" | "settings";

/**
 * Hook for feature-specific loading states
 * Provides loading indicators for specific features/modules
 */
export function useFeatureLoading(feature: FeatureType) {
  // Get the appropriate query key pattern for the feature
  const getFeatureQueryKey = (feature: FeatureType): unknown[] => {
    switch (feature) {
      case "auth": {
        return queryKeys.auth.all();
      }
      case "habits": {
        return queryKeys.habits.all();
      }
      case "goals": {
        return queryKeys.goals.all();
      }
      case "macros": {
        return queryKeys.macros.all();
      }
      case "settings": {
        return queryKeys.settings.all();
      }
      default: {
        return [];
      }
    }
  };

  const featureQueryKey = getFeatureQueryKey(feature);

  // Check for queries matching the feature pattern
  const isFetching = useIsFetching({
    queryKey: featureQueryKey,
  });

  // Check for mutations matching the feature pattern
  const isMutating = useIsMutating({
    mutationKey: featureQueryKey,
  });

  return {
    /**
     * True if any query for this feature is fetching
     */
    isQueryLoading: isFetching > 0,

    /**
     * True if any mutation for this feature is running
     */
    isMutationLoading: isMutating > 0,

    /**
     * True if any operation for this feature is active
     */
    isLoading: isFetching > 0 || isMutating > 0,

    /**
     * Number of active queries for this feature
     */
    activeQueries: isFetching,

    /**
     * Number of active mutations for this feature
     */
    activeMutations: isMutating,
  };
}

/**
 * Hook for checking loading state of specific queries within a feature
 */
export function useSpecificQueryLoading(queryKey: unknown[]) {
  const isFetching = useIsFetching({ queryKey });

  return {
    /**
     * True if the specific query is fetching
     */
    isLoading: isFetching > 0,

    /**
     * Number of times this query is currently fetching
     */
    fetchCount: isFetching,
  };
}

/**
 * Hook for checking loading state of specific mutations
 */
export function useSpecificMutationLoading(mutationKey?: unknown[]) {
  const isMutating = useIsMutating({
    mutationKey: mutationKey,
  });

  return {
    /**
     * True if the specific mutation is running
     */
    isLoading: isMutating > 0,

    /**
     * Number of times this mutation is currently running
     */
    mutationCount: isMutating,
  };
}

/**
 * Hook for aggregating loading states of multiple features
 */
export function useMultiFeatureLoading(features: FeatureType[]) {
  const loadingStates = features.map((feature) => useFeatureLoading(feature));

  const isAnyQueryLoading = loadingStates.some((state) => state.isQueryLoading);
  const isAnyMutationLoading = loadingStates.some(
    (state) => state.isMutationLoading,
  );
  const isAnyLoading = loadingStates.some((state) => state.isLoading);

  const totalActiveQueries = loadingStates.reduce(
    (sum, state) => sum + state.activeQueries,
    0,
  );
  const totalActiveMutations = loadingStates.reduce(
    (sum, state) => sum + state.activeMutations,
    0,
  );

  return {
    /**
     * True if any query across the specified features is loading
     */
    isQueryLoading: isAnyQueryLoading,

    /**
     * True if any mutation across the specified features is running
     */
    isMutationLoading: isAnyMutationLoading,

    /**
     * True if any operation across the specified features is active
     */
    isLoading: isAnyLoading,

    /**
     * Total number of active queries across all features
     */
    totalActiveQueries,

    /**
     * Total number of active mutations across all features
     */
    totalActiveMutations,

    /**
     * Loading state for each individual feature
     */
    featureStates: features.reduce(
      (accumulator, feature, index) => {
        accumulator[feature] = loadingStates[index];
        return accumulator;
      },
      {} as Record<FeatureType, ReturnType<typeof useFeatureLoading>>,
    ),
  };
}
