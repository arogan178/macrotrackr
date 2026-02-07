import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { normalizeWeightGoals } from "@/features/goals/utils/goalUtilities";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { WeightGoalFormValues, WeightGoals } from "@/types/goal";
import {
  AddWeightLogPayload,
  apiService,
  WeightLogEntry,
} from "@/utils/apiServices";
import { todayISO } from "@/utils/dateUtilities";

// Query hook for fetching weight goals
export function useWeightGoals() {
  return useQuery({
    queryKey: queryKeys.goals.weight(),
    queryFn: async (): Promise<WeightGoals | null> => {
      const data = await apiService.goals.getWeightGoals();
      return normalizeWeightGoals(data, undefined);
    },
    ...queryConfigs.longLived,
    placeholderData: (previousData) => previousData,
  });
}

// Query hook for fetching weight log entries
export function useWeightLog() {
  return useQuery({
    queryKey: queryKeys.goals.weightLog(),
    queryFn: async (): Promise<WeightLogEntry[]> => {
      return await apiService.goals.getWeightLog();
    },
    ...queryConfigs.longLived, // 5 minutes stale time for goals
  });
}

// Mutation hook for creating weight goals
export function useCreateWeightGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goals,
      tdee,
    }: {
      goals: WeightGoalFormValues;
      tdee: number;
    }) => {
      // Start both operations in parallel to avoid waterfall
      const createPromise = apiService.goals.createWeightGoal(goals, tdee);
      const weightLogPromise = apiService.goals.getWeightLog();

      try {
        const [result, weightLog] = await Promise.all([
          createPromise,
          weightLogPromise,
        ]);

        const today = todayISO();
        const hasEntryForToday = weightLog.some((entry) =>
          entry.timestamp.startsWith(today),
        );

        // If no entry for today, add the starting weight
        if (!hasEntryForToday && goals.startingWeight) {
          await apiService.goals.addWeightLogEntry({
            weight: goals.startingWeight,
            timestamp: new Date().toISOString(),
          });
        }

        return result;
      } catch (error) {
        // If create fails because goal already exists, try to update instead
        const apiError = error as { status?: number; message?: string };
        if (
          apiError?.status === 409 ||
          apiError?.message?.includes("already exists")
        ) {
          return await apiService.goals.updateWeightGoal(goals, tdee);
        }
        throw error;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog() });
    },
  });
}

// Mutation hook for updating weight goals
export function useUpdateWeightGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goals,
      tdee,
    }: {
      goals: WeightGoalFormValues;
      tdee: number;
    }) => {
      try {
        return await apiService.goals.updateWeightGoal(goals, tdee);
      } catch (error) {
        // If update fails with 404 (goal not found), try to create instead
        const apiError = error as { status?: number };
        if (apiError?.status === 404) {
          return await apiService.goals.createWeightGoal(goals, tdee);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      const updatedGoals = normalizeWeightGoals(data, undefined);
      if (updatedGoals) {
        queryClient.setQueryData<WeightGoals>(
          queryKeys.goals.weight(),
          updatedGoals,
        );
      }
    },
  });
}

// Mutation hook for deleting weight goals
export function useDeleteWeightGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await apiService.goals.deleteWeightGoals();
    },
    onSuccess: () => {
      // Remove from cache immediately for instant UI feedback
      queryClient.removeQueries({ queryKey: queryKeys.goals.weight() });
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all() });
    },
  });
}

// Mutation hook for adding weight log entry with optimistic updates
export function useAddWeightLogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: AddWeightLogPayload,
    ): Promise<WeightLogEntry> => {
      return await apiService.goals.addWeightLogEntry(payload);
    },
    onMutate: async (variables: AddWeightLogPayload) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.goals.weightLog(),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.weight() });

      // Snapshot previous values for rollback on error
      const previousWeightLog = queryClient.getQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
      );
      const previousWeightGoals = queryClient.getQueryData<WeightGoals | null>(
        queryKeys.goals.weight(),
      );
      const previousUser = queryClient.getQueryData<{ weight?: number } | null>(
        queryKeys.auth.user(),
      );

      // Create optimistic entry with temporary ID
      const optimisticEntry: WeightLogEntry = {
        id: `temp-${Date.now()}`,
        weight: variables.weight,
        timestamp: variables.timestamp,
      };

      // Optimistically update weight log
      queryClient.setQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
        (oldData) => {
          if (!oldData) return [optimisticEntry];
          return [...oldData, optimisticEntry];
        },
      );

      // Optimistically update weight goals current weight
      queryClient.setQueryData<WeightGoals | null>(
        queryKeys.goals.weight(),
        (oldData) => {
          if (!oldData) return oldData;
          return { ...oldData, currentWeight: variables.weight };
        },
      );

      // Optimistically update user weight
      queryClient.setQueryData(
        queryKeys.auth.user(),
        (oldUser: { weight?: number } | null) => {
          if (!oldUser) return oldUser;
          return { ...oldUser, weight: variables.weight };
        },
      );

      return { optimisticEntry, previousWeightLog, previousWeightGoals, previousUser };
    },
    onError: (error, _variables, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousWeightLog) {
        queryClient.setQueryData(queryKeys.goals.weightLog(), context.previousWeightLog);
      }
      if (context?.previousWeightGoals) {
        queryClient.setQueryData(queryKeys.goals.weight(), context.previousWeightGoals);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.user(), context.previousUser);
      }
      console.error("Failed to add weight log entry:", error);
    },
    onSuccess: (newEntry, _variables, context) => {
      // Replace optimistic entry with real data from server
      queryClient.setQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
        (oldData) => {
          if (!oldData) return [newEntry];
          return oldData.map((entry) =>
            entry.id === context?.optimisticEntry?.id ? newEntry : entry,
          );
        },
      );
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight() });
    },
  });
}

// Mutation hook for deleting weight log entry
export function useDeleteWeightLogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      id: string,
    ): Promise<{ success: boolean; id: string }> => {
      return await apiService.goals.deleteWeightLogEntry(id);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.goals.weightLog(),
      });

      // Snapshot the previous value
      const previousWeightLog = queryClient.getQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
      );

      // Optimistically update to remove the entry
      if (previousWeightLog) {
        queryClient.setQueryData<WeightLogEntry[]>(
          queryKeys.goals.weightLog(),
          previousWeightLog.filter((entry) => entry.id !== id),
        );
      }

      // Return a context object with the snapshotted value
      return { previousWeightLog };
    },
    onError: (error, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWeightLog) {
        queryClient.setQueryData(
          queryKeys.goals.weightLog(),
          context.previousWeightLog,
        );
      }
      console.error("Error deleting weight log entry:", error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.refetchQueries({ queryKey: queryKeys.goals.weightLog() });
      // Also refetch weight goals to update current weight
      queryClient.refetchQueries({ queryKey: queryKeys.goals.weight() });
    },
  });
}
