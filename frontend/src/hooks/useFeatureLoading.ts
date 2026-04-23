import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";

export type FeatureType =
  | "auth"
  | "habits"
  | "goals"
  | "macros"
  | "reports"
  | "settings";

/**
 * Hook for feature-specific loading states
 * Provides loading indicators for specific features/modules
 */
export function useFeatureLoading(feature: FeatureType) {
  // Get the appropriate query key pattern for the feature
  const getFeatureQueryKey = (feat: FeatureType): unknown[] => {
    switch (feat) {
      case "auth": {
        return [...queryKeys.auth.all()];
      }
      case "habits": {
        return [...queryKeys.habits.all()];
      }
      case "goals": {
        return [...queryKeys.goals.all()];
      }
      case "macros": {
        return [...queryKeys.macros.all()];
      }
      case "settings": {
        return [...queryKeys.settings.all()];
      }
      case "reports": {
        return [...queryKeys.macros.all()];
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

type UseFeatureLoadingResult = ReturnType<typeof useFeatureLoading>;

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
export function useMultiFeatureLoading(requested: FeatureType[]) {
  // For each known feature, compute keys and call query/mutation hooks in a fixed order
  const authKey = [...queryKeys.auth.all()];
  const authFetching = useIsFetching({ queryKey: authKey });
  const authMutating = useIsMutating({ mutationKey: authKey });

  const habitsKey = [...queryKeys.habits.all()];
  const habitsFetching = useIsFetching({ queryKey: habitsKey });
  const habitsMutating = useIsMutating({ mutationKey: habitsKey });

  const goalsKey = [...queryKeys.goals.all()];
  const goalsFetching = useIsFetching({ queryKey: goalsKey });
  const goalsMutating = useIsMutating({ mutationKey: goalsKey });

  const macrosKey = [...queryKeys.macros.all()];
  const macrosFetching = useIsFetching({ queryKey: macrosKey });
  const macrosMutating = useIsMutating({ mutationKey: macrosKey });

  const settingsKey = [...queryKeys.settings.all()];
  const settingsFetching = useIsFetching({ queryKey: settingsKey });
  const settingsMutating = useIsMutating({ mutationKey: settingsKey });

  const perFeature = {
    auth: {
      isQueryLoading: authFetching > 0,
      isMutationLoading: authMutating > 0,
      isLoading: authFetching > 0 || authMutating > 0,
      activeQueries: authFetching,
      activeMutations: authMutating,
    },
    habits: {
      isQueryLoading: habitsFetching > 0,
      isMutationLoading: habitsMutating > 0,
      isLoading: habitsFetching > 0 || habitsMutating > 0,
      activeQueries: habitsFetching,
      activeMutations: habitsMutating,
    },
    goals: {
      isQueryLoading: goalsFetching > 0,
      isMutationLoading: goalsMutating > 0,
      isLoading: goalsFetching > 0 || goalsMutating > 0,
      activeQueries: goalsFetching,
      activeMutations: goalsMutating,
    },
    macros: {
      isQueryLoading: macrosFetching > 0,
      isMutationLoading: macrosMutating > 0,
      isLoading: macrosFetching > 0 || macrosMutating > 0,
      activeQueries: macrosFetching,
      activeMutations: macrosMutating,
    },
    settings: {
      isQueryLoading: settingsFetching > 0,
      isMutationLoading: settingsMutating > 0,
      isLoading: settingsFetching > 0 || settingsMutating > 0,
      activeQueries: settingsFetching,
      activeMutations: settingsMutating,
    },
  } as const;

  const featureStates: Record<FeatureType, UseFeatureLoadingResult> = {
    auth: perFeature.auth,
    habits: perFeature.habits,
    goals: perFeature.goals,
    macros: perFeature.macros,
    reports: perFeature.macros,
    settings: perFeature.settings,
  };

  const filtered = requested.map((feature) => featureStates[feature]);

  const isAnyQueryLoading = filtered.some((s) => s.isQueryLoading);
  const isAnyMutationLoading = filtered.some((s) => s.isMutationLoading);
  const isAnyLoading = filtered.some((s) => s.isLoading);

  const totalActiveQueries = filtered.reduce((sum, s) => sum + s.activeQueries, 0);
  const totalActiveMutations = filtered.reduce((sum, s) => sum + s.activeMutations, 0);

  return {
    isQueryLoading: isAnyQueryLoading,
    isMutationLoading: isAnyMutationLoading,
    isLoading: isAnyLoading,
    totalActiveQueries,
    totalActiveMutations,
    featureStates,
  };
}
