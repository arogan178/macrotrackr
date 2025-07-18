import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { WeightGoals, WeightGoalFormValues } from "@/types/goal";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, WeightLogEntry, AddWeightLogPayload } from "@/utils/apiServices";

// Query hook for fetching weight goals
export function useWeightGoals() {
  return useQuery({
    queryKey: queryKeys.goals.weight(),
    queryFn: async (): Promise<WeightGoals | null> => {
      const weightGoalsData = await apiService.goals.getWeightGoals();
      
      if (!weightGoalsData) {
        return null; // Return null instead of undefined
      }

      // Get weight log to calculate current weight
      const weightLog = await apiService.goals.getWeightLog();
      const latestWeight = weightLog.length > 0 
        ? weightLog[weightLog.length - 1].weight 
        : weightGoalsData.startingWeight;

      // Transform API response to match WeightGoals interface with defaults
      return {
        ...weightGoalsData,
        currentWeight: latestWeight,
        targetWeight: weightGoalsData.targetWeight || weightGoalsData.startingWeight,
        weightGoal: (weightGoalsData.weightGoal || "maintain") as "lose" | "maintain" | "gain",
        startDate: weightGoalsData.startDate || new Date().toISOString().split("T")[0],
        targetDate: weightGoalsData.targetDate || new Date().toISOString().split("T")[0],
        calorieTarget: weightGoalsData.calorieTarget || 2000,
        calculatedWeeks: weightGoalsData.calculatedWeeks || 1,
        weeklyChange: weightGoalsData.weeklyChange || 0,
        dailyChange: weightGoalsData.dailyChange || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Query hook for fetching weight log entries
export function useWeightLog() {
  return useQuery({
    queryKey: queryKeys.goals.weightLog(),
    queryFn: async (): Promise<WeightLogEntry[]> => {
      return await apiService.goals.getWeightLog();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for creating weight goals
export function useCreateWeightGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goals, tdee }: { goals: WeightGoalFormValues; tdee: number }) => {
      try {
        // Create the weight goal
        const result = await apiService.goals.createWeightGoal(goals, tdee);
        
        // Also log the starting weight as a weight log entry
        // Only if we don't already have a weight log entry for today
        const weightLog = await apiService.goals.getWeightLog();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Check if we already have a weight entry for today
        const hasEntryForToday = weightLog.some(entry => {
          const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
          return entryDate === today;
        });
        
        // If no entry for today, add the starting weight
        if (!hasEntryForToday) {
          await apiService.goals.addWeightLogEntry({
            weight: goals.startingWeight,
            timestamp: new Date().toISOString()
          });
        }
        
        return result;
      } catch (error: any) {
        // If create fails because goal already exists, try to update instead
        if (error?.status === 409 || error?.message?.includes("already exists")) {
          return await apiService.goals.updateWeightGoal(goals, tdee);
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate weight goals and weight log queries
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog() });
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
    mutationFn: async ({ goals, tdee }: { goals: WeightGoalFormValues; tdee: number }) => {
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
    onSuccess: () => {
      // Invalidate weight goals and weight log queries
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog() });
    },
    onError: (error) => {
      console.error("Error updating weight goal:", error);
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
      // Clear weight goals cache and invalidate related queries
      queryClient.setQueryData(queryKeys.goals.weight(), null);
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.all() });
    },
    onError: (error) => {
      console.error("Error deleting weight goals:", error);
    },
  });
}

// Mutation hook for adding weight log entry
export function useAddWeightLogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddWeightLogPayload): Promise<WeightLogEntry> => {
      return await apiService.goals.addWeightLogEntry(payload);
    },
    onSuccess: (newEntry) => {
      // Optimistically update weight log cache
      queryClient.setQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog(),
        (oldData) => {
          if (!oldData) return [newEntry];
          return [...oldData, newEntry];
        }
      );
      
      // Invalidate weight goals to update current weight
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight() });
    },
    onError: (error) => {
      console.error("Error adding weight log entry:", error);
      // Invalidate to refetch fresh data on error
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog() });
    },
  });
}

// Mutation hook for deleting weight log entry
export function useDeleteWeightLogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; id: string }> => {
      return await apiService.goals.deleteWeightLogEntry(id);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goals.weightLog() });

      // Snapshot the previous value
      const previousWeightLog = queryClient.getQueryData<WeightLogEntry[]>(
        queryKeys.goals.weightLog()
      );

      // Optimistically update to remove the entry
      if (previousWeightLog) {
        queryClient.setQueryData<WeightLogEntry[]>(
          queryKeys.goals.weightLog(),
          previousWeightLog.filter((entry) => entry.id !== id)
        );
      }

      // Return a context object with the snapshotted value
      return { previousWeightLog };
    },
    onError: (error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWeightLog) {
        queryClient.setQueryData(queryKeys.goals.weightLog(), context.previousWeightLog);
      }
      console.error("Error deleting weight log entry:", error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weightLog() });
      // Also invalidate weight goals to update current weight
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.weight() });
    },
  });
}