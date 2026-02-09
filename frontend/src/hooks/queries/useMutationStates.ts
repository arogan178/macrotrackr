import { useMutationState } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";

/**
 * Hook to check if any weight goal mutation is in progress
 * Useful for showing global loading indicators or disabling buttons
 */
export function useWeightGoalMutationsPending() {
  const mutations = useMutationState({
    filters: {
      mutationKey: queryKeys.goals.weight(),
    },
  });

  return mutations.some((m) => m.status === "pending");
}

/**
 * Hook to check if any weight log mutation is in progress
 */
export function useWeightLogMutationsPending() {
  const mutations = useMutationState({
    filters: {
      mutationKey: queryKeys.goals.weightLog(),
    },
  });

  return mutations.some((m) => m.status === "pending");
}
