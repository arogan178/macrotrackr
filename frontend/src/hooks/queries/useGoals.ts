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

      // Get weight log to calculate current weight
      const weightLog = await apiService.goals.getWeightLog();

      // Determine latest weight without using .at() (TS lib compatibility) and satisfying lint
      let latestWeight = weightGoalsData.startingWeight;
      if (weightLog.length > 0) {
        const lastIndex = weightLog.length - 1;
         
        latestWeight = weightLog[lastIndex].weight;
      }

      // Transform API response to match WeightGoals interface with defaults
      return {
        ...weightGoalsData,
        currentWeight: latestWeight,
        targetWeight:
          weightGoalsData.targetWeight || weightGoalsData.startingWeight,
        weightGoal: (weightGoalsData.weightGoal || "maintain") as
          | "lose"
          | "maintain"
          | "gain",
        startDate:
          weightGoalsData.startDate || new Date().toISOString().split("T")[0],
        targetDate:
          weightGoalsData.targetDate || new Date().toISOString().split("T")[0],
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
    onSuccess: () => {
      // Invalidate and refetch weight goals and weight log queries immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog(), refetchType: 'active' });
      // Invalidate and refetch weight goals and weight log queries immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog(), refetchType: 'active' });
    },
    onError: (error) => {
      console.error("Error creating weight goal:", error);
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
      currentWeight: providedCurrentWeight,
    }: {
      goals: WeightGoalFormValues;
      tdee: number;
      currentWeight?: number;
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
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.weight() });
      
      // Snapshot the previous value to preserve currentWeight during mutation
      const previousWeightGoals = queryClient.getQueryData<WeightGoals>(
        queryKeys.goals.weight(),
      );
      
      return { previousWeightGoals };
    },
    onSuccess: (data, variables, context) => {
      // Get currentWeight from: provided param > cache snapshot > data response > startingWeight fallback
      // Never default to 0 as that causes incorrect progress calculations
      const snap = context?.previousWeightGoals;
      const preservedCurrentWeight = variables.currentWeight ?? 
                                     snap?.currentWeight ?? 
                                     data.currentWeight ?? 
                                     data.startingWeight ?? 
                                     0;
      
      // Create a properly typed WeightGoals object with all required fields
      const updatedGoals: WeightGoals = {
        startingWeight: data.startingWeight ?? snap?.startingWeight ?? 0,
        currentWeight: preservedCurrentWeight,
        targetWeight: data.targetWeight ?? snap?.targetWeight ?? 0,
        weightGoal: (data.weightGoal || snap?.weightGoal || "maintain") as "lose" | "maintain" | "gain",
        startDate: data.startDate ?? snap?.startDate ?? new Date().toISOString().split("T")[0],
        targetDate: data.targetDate ?? snap?.targetDate ?? new Date().toISOString().split("T")[0],
        calorieTarget: data.calorieTarget ?? snap?.calorieTarget ?? 2000,
        calculatedWeeks: data.calculatedWeeks ?? snap?.calculatedWeeks ?? 1,
        weeklyChange: data.weeklyChange ?? snap?.weeklyChange ?? 0,
        dailyChange: data.dailyChange ?? snap?.dailyChange ?? 0,
      };
      
      // Immediately update the cache with the complete data including preserved currentWeight
      // This prevents any flash of incorrect progress
      queryClient.setQueryData<WeightGoals>(
        queryKeys.goals.weight(),
        updatedGoals
      );
      
      // NOTE: We intentionally do NOT invalidate here because:
      // 1. The API response doesn't include currentWeight, so refetching would lose it
      // 2. We already have the correct data with currentWeight preserved in the cache
      // 3. The weight log query will be refetched separately when needed
      // The data will be naturally refreshed on next page load or when user manually refreshes
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousWeightGoals) {
        queryClient.setQueryData(
          queryKeys.goals.weight(),
          context.previousWeightGoals,
        );
      }
      console.error("Error updating weight goal:", error);
    },
  });
}

// Mutation hook for deleting weight goals with optimistic updates
export function useDeleteWeightGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await apiService.goals.deleteWeightGoals();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.weight() });

      // Snapshot the previous value
      const previousWeightGoals = queryClient.getQueryData(
        queryKeys.goals.weight(),
      );

      // Optimistically remove the weight goals query from cache so any components treat it as non-existent
      // This avoids downstream logic (e.g., ensureQueryData in route loaders) encountering an explicit undefined value
      // which can trigger "data is undefined" errors.
      queryClient.removeQueries({ queryKey: queryKeys.goals.weight() });

      return { previousWeightGoals };
    },
    onError: (error, _variables, _context) => {
      // Rollback optimistic update
      if (_context?.previousWeightGoals !== undefined) {
        queryClient.setQueryData(
          queryKeys.goals.weight(),
          _context.previousWeightGoals,
        );
      }
      console.error("Error deleting weight goals:", error);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.goals.weightLog(),
      });
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.weight() });

      // Snapshot previous data
      const previousWeightLog = queryClient.getQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
      );
      const previousWeightGoals = queryClient.getQueryData(
        queryKeys.goals.weight(),
      );

      // Create optimistic entry
      const optimisticEntry: WeightLogEntry = {
        id: `temp-${Date.now()}`, // Temporary ID
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

      // Optimistically update weight goals current weight AND recompute derived fields
      // Also mirror user.weight so UI numbers (e.g., the number before the > icon) update immediately.
      queryClient.setQueryData<WeightGoals | null>(
        queryKeys.goals.weight(),
        (oldData) => {
          if (!oldData) return oldData;

          const updated: WeightGoals = {
            ...oldData,
            currentWeight: variables.weight,
            // Keep target and starting weights unchanged
          };

          return updated;
        },
      );

      // Also optimistically update the user settings cache so any UI reading user.weight updates immediately.
      // Adjusted to known query key group present in queryKeys.
      queryClient.setQueryData(
        queryKeys.auth.user(),
        (oldUser: any) => {
          if (!oldUser) return oldUser;
          return {
            ...oldUser,
            weight: variables.weight,
          };
        },
      );

      return { previousWeightLog, previousWeightGoals };
    },
    onError: (error, _variables, _context) => {
      // Rollback optimistic updates
      if (_context?.previousWeightLog !== undefined) {
        queryClient.setQueryData(
          queryKeys.goals.weightLog(),
          _context.previousWeightLog,
        );
      }
      if (_context?.previousWeightGoals !== undefined) {
        queryClient.setQueryData(
          queryKeys.goals.weight(),
          _context.previousWeightGoals,
        );
      }
      console.error("Error adding weight log entry:", error);
    },
    onSuccess: (newEntry, _variables, _context) => {
      // Update with real data from server
      queryClient.setQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
        (oldData) => {
          if (!oldData) return [newEntry];
          // Replace the optimistic entry with the real one
          return oldData.map((entry) =>
            entry.id.toString().startsWith("temp-") ? newEntry : entry,
          );
        },
      );
    },
    onSettled: () => {
      // Always refetch to ensure consistency - use refetchQueries to force immediate refetch
      queryClient.refetchQueries({ queryKey: queryKeys.goals.weightLog() });
      queryClient.refetchQueries({ queryKey: queryKeys.goals.weight() });
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
