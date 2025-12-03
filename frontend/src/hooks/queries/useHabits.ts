import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { HabitGoal, HabitGoalFormValues } from "@/types/habit";
import {
  completeHabit,
  createNewHabit,
  incrementHabitProgress,
  updateHabitFromForm,
} from "@/features/habits/utils";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";
import { apiService } from "@/utils/apiServices";

// Query hook for fetching habits
export function useHabits() {
  return useQuery({
    queryKey: queryKeys.habits.list(),
    queryFn: async (): Promise<HabitGoal[]> => {
      return await apiService.habits.getHabit();
    },
    ...queryConfigs.longLived, // 5 minutes stale time for habits
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
      // Ensure backend-required fields are present: id, progress, createdAt
      const payload = {
        ...updatedHabit,
        id: existingHabit.id,
        progress:
          typeof updatedHabit.progress === "number"
            ? updatedHabit.progress
            : Math.min(
                100,
                Math.round((existingHabit.current / updatedHabit.target) * 100),
              ),
        createdAt: existingHabit.createdAt,
      };
      return await apiService.habits.updateHabit(id, payload);
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
    onError: (error, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits.list(),
          context.previousHabits,
        );
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
  const _showNotification = useStore((state) => state.showNotification);

  return useMutation({
    // Accept the full habit object instead of just the id
    mutationFn: async (habit: HabitGoal): Promise<{ success: boolean }> => {
      if (!habit) {
        throw new Error("Habit not found");
      }
      if (habit.isComplete) {
        throw new Error("Habit is already complete");
      }
      // Only increment once, using the original habit object
      const updatedHabit = incrementHabitProgress(habit);
      return await apiService.habits.updateHabit(habit.id, updatedHabit);
    },
    onMutate: async (habit: HabitGoal) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });
      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      // Validate the habit can be incremented
      if (!habit || habit.isComplete) {
        throw new Error("Habit not found or already complete");
      }
      // Calculate the updated habit for optimistic update
      const updatedHabit = incrementHabitProgress(habit);
      // Optimistically update the cache
      if (previousHabits) {
        const updatedHabits = previousHabits.map((h) => {
          if (h.id === habit.id) {
            return updatedHabit;
          }
          return h;
        });
        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          updatedHabits,
        );
      }
      return { previousHabits };
    },
    onSuccess: (_data, _variables, _context) => {
      // Notification of completion is centralized in Goals mutations to avoid duplicates.
      // Here we only ensure cache is up to date via onSettled invalidation below.
    },
    onError: (error, _variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits.list(),
          context.previousHabits,
        );
      }
      console.error("Error incrementing habit progress:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
  });
}

// Mutation hook for completing a habit with optimistic updates
export function useCompleteHabit() {
  const queryClient = useQueryClient();
  const _showNotification = useStore((state) => state.showNotification);

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      console.log("useCompleteHabit mutationFn called with id:", id);
      // Get current habits to find the habit to complete
      const currentHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      const habit = currentHabits?.find((h) => h.id === id);
      console.log("Found habit:", habit);

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
      console.log("Original habit:", habit);
      console.log("Completed habit:", completedHabit);
      console.log("Sending completed habit to API:", completedHabit);
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
    onError: (error, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits.list(),
          context.previousHabits,
        );
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
