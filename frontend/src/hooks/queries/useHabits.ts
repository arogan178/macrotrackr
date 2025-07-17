import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { HabitGoal, HabitGoalFormValues } from "@/features/habits/types/types";
import { queryKeys } from "@/lib/queryKeys";
import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import {
  completeHabit,
  createNewHabit,
  incrementHabitProgress,
  updateHabitFromForm,
} from "@/features/habits/utils";

// Query hook for fetching habits
export function useHabits() {
  return useQuery({
    queryKey: queryKeys.habits.list(),
    queryFn: async (): Promise<HabitGoal[]> => {
      return await apiService.habits.getHabit();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for adding a new habit
export function useAddHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: HabitGoalFormValues): Promise<HabitGoal> => {
      const newHabit = createNewHabit(values);
      return await apiService.habits.saveHabit(newHabit);
    },
    onSuccess: () => {
      // Invalidate and refetch habits list
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
    onError: (error) => {
      console.error("Error adding habit:", error);
    },
  });
}

// Mutation hook for updating a habit
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: HabitGoalFormValues;
    }): Promise<{ success: boolean }> => {
      // Get current habits to find the existing habit
      const currentHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      const existingHabit = currentHabits?.find((habit) => habit.id === id);

      if (!existingHabit) {
        throw new Error("Habit not found");
      }

      // Prevent editing of completed habits
      if (existingHabit.isComplete) {
        throw new Error("Completed habits cannot be edited");
      }

      // Prevent decreasing the target below the current value
      if (values.target < existingHabit.current) {
        throw new Error("Target cannot be lower than current progress");
      }

      const updatedHabit = updateHabitFromForm(existingHabit, values);
      return await apiService.habits.updateHabit(id, updatedHabit);
    },
    onSuccess: () => {
      // Invalidate and refetch habits list
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
    onError: (error) => {
      console.error("Error updating habit:", error);
    },
  });
}
// Mutation hook for deleting a habit with optimistic updates
export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      return await apiService.habits.deleteHabit(id);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      // Optimistically update to remove the habit
      if (previousHabits) {
        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          previousHabits.filter((habit) => habit.id !== id),
        );
      }

      // Return a context object with the snapshotted value
      return { previousHabits };
    },
    onError: (error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(), context.previousHabits);
      }
      console.error("Error deleting habit:", error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
  });
}

// Mutation hook for incrementing habit progress with optimistic updates
export function useIncrementHabitProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      // Get current habits to find the habit to update
      const currentHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      const habit = currentHabits?.find((h) => h.id === id);

      if (!habit || habit.isComplete) {
        throw new Error("Habit not found or already complete");
      }

      const updatedHabit = incrementHabitProgress(habit);
      return await apiService.habits.updateHabit(id, updatedHabit);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      // Optimistically update the habit progress
      if (previousHabits) {
        const updatedHabits = previousHabits.map((habit) => {
          if (habit.id === id && !habit.isComplete) {
            return incrementHabitProgress(habit);
          }
          return habit;
        });

        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          updatedHabits,
        );
      }

      // Return a context object with the snapshotted value
      return { previousHabits };
    },
    onError: (error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(), context.previousHabits);
      }
      console.error("Error incrementing habit progress:", error);
    },
    onSuccess: () => {
      // Only invalidate on success to avoid overwriting optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
  });
}

// Mutation hook for completing a habit with optimistic updates
export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      console.log('useCompleteHabit mutationFn called with id:', id);
      // Get current habits to find the habit to complete
      const currentHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      const habit = currentHabits?.find((h) => h.id === id);
      console.log('Found habit:', habit);

      if (!habit) {
        throw new Error("Habit not found");
      }

      // Create the completed habit with the correct state
      // Always create completed version to ensure API gets the right data
      const completedHabit = {
        ...habit,
        current: habit.target,
        progress: 100,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };
      console.log('Original habit:', habit);
      console.log('Completed habit:', completedHabit);
      console.log('Sending completed habit to API:', completedHabit);
      return await apiService.habits.updateHabit(id, completedHabit);
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      // Optimistically update the habit to completed
      if (previousHabits) {
        const updatedHabits = previousHabits.map((habit) => {
          if (habit.id === id && !habit.isComplete) {
            return completeHabit(habit);
          }
          return habit;
        });

        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          updatedHabits,
        );
      }

      // Return a context object with the snapshotted value
      return { previousHabits };
    },
    onError: (error, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits.list(), context.previousHabits);
      }
      console.error("Error completing habit:", error);
    },
    onSuccess: () => {
      // Only invalidate on success to avoid overwriting optimistic updates
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
  });
}

// Mutation hook for resetting all habits
export function useResetHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ success: boolean }> => {
      return await apiService.habits.resetHabit();
    },
    onSuccess: () => {
      // Clear the habits cache and refetch
      queryClient.setQueryData<HabitGoal[]>(queryKeys.habits.list(), []);
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
    onError: (error) => {
      console.error("Error resetting habits:", error);
    },
  });
}