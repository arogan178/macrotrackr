import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { WeightGoalFormValues, WeightGoals } from "@/types/goal";
import {
  AddWeightLogPayload,
  apiService,
  WeightLogEntry,
} from "@/utils/apiServices";

// Query hook for fetching weight goals
export function useWeightGoals() {
  return useQuery({
    queryKey: queryKeys.goals.weight(),
    // Important: TanStack Query throws if ensureQueryData resolves to undefined.
    // We return null explicitly to represent "no goals set".
    queryFn: async (): Promise<WeightGoals | null> => {
      const weightGoalsData = await apiService.goals.getWeightGoals();

      // eslint-disable-next-line unicorn/no-null
      if (!weightGoalsData) return null;

      // Transform API response to match WeightGoals interface with defaults
      // API now returns currentWeight calculated from weight log
      return {
        startingWeight: weightGoalsData.startingWeight,
        currentWeight: weightGoalsData.currentWeight ?? weightGoalsData.startingWeight,
        targetWeight: weightGoalsData.targetWeight || weightGoalsData.startingWeight,
        weightGoal: (weightGoalsData.weightGoal || "maintain") as
          | "lose"
          | "maintain"
          | "gain",
        startDate: weightGoalsData.startDate || new Date().toISOString().split("T")[0],
        targetDate: weightGoalsData.targetDate || new Date().toISOString().split("T")[0],
        calorieTarget: weightGoalsData.calorieTarget || 2000,
        calculatedWeeks: weightGoalsData.calculatedWeeks || 1,
        weeklyChange: weightGoalsData.weeklyChange || 0,
        dailyChange: weightGoalsData.dailyChange ?? 0,
      };
    },
    ...queryConfigs.longLived, // 5 minutes stale time for goals
    // Keep previous data during refetch to prevent UI flashing
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
      try {
        // Create the weight goal
        const result = await apiService.goals.createWeightGoal(goals, tdee);

        // Also log the starting weight as a weight log entry
        // Only if we don't already have a weight log entry for today
        const weightLog = await apiService.goals.getWeightLog();
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // Check if we already have a weight entry for today
        const hasEntryForToday = weightLog.some((entry) => {
          const entryDate = new Date(entry.timestamp)
            .toISOString()
            .split("T")[0];
          return entryDate === today;
        });

        // If no entry for today, add the starting weight
        if (!hasEntryForToday) {
          await apiService.goals.addWeightLogEntry({
            weight: goals.startingWeight ?? 0,
            timestamp: new Date().toISOString(),
          });
        }

        return result;
      } catch (error: any) {
        // If create fails because goal already exists, try to update instead
        if (
          error?.status === 409 ||
          error?.message?.includes("already exists")
        ) {
          return await apiService.goals.updateWeightGoal(goals, tdee);
        }
        throw error;
      }
    },
    onSettled: () => {
      // Always invalidate to ensure consistency after mutation completes (success or error)
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
      } catch (error: any) {
        // If update fails with 404 (goal not found), try to create instead
        if (error?.status === 404) {
          return await apiService.goals.createWeightGoal(goals, tdee);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      const updatedGoals: WeightGoals = {
        startingWeight: data.startingWeight ?? 0,
        currentWeight: data.currentWeight ?? data.startingWeight ?? 0,
        targetWeight: data.targetWeight ?? 0,
        weightGoal: (data.weightGoal || "maintain") as "lose" | "maintain" | "gain",
        startDate: data.startDate || new Date().toISOString().split("T")[0],
        targetDate: data.targetDate || new Date().toISOString().split("T")[0],
        calorieTarget: data.calorieTarget || 2000,
        calculatedWeeks: data.calculatedWeeks || 1,
        weeklyChange: data.weeklyChange || 0,
        dailyChange: data.dailyChange ?? 0,
      };
      
      // Update cache with data from API (includes currentWeight)
      queryClient.setQueryData<WeightGoals>(
        queryKeys.goals.weight(),
        updatedGoals
      );
    },
    // No onSettled needed - API returns complete data with currentWeight
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

      return { optimisticEntry };
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
