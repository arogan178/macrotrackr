import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buildHabitUpdatePayload,
  completeHabit,
  createNewHabit,
  incrementHabitProgress,
  updateHabitFromForm,
} from "@/features/goals/utils/habits";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { HabitGoal, HabitGoalFormValues } from "@/types/habit";
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
    mutationKey: [...queryKeys.habits.list(), "add"],
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
    mutationKey: [...queryKeys.habits.list(), "update"],
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: HabitGoalFormValues;
    }): Promise<{ success: boolean }> => {
      const currentHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      const existingHabit = currentHabits?.find((habit) => habit.id === id);

      if (!existingHabit) {
        throw new Error("Habit not found");
      }

      if (existingHabit.isComplete) {
        throw new Error("Completed habits cannot be edited");
      }

      if (values.target < existingHabit.current) {
        throw new Error("Target cannot be lower than current progress");
      }

      const updatedHabit = updateHabitFromForm(existingHabit, values);
      const payload = buildHabitUpdatePayload(existingHabit, updatedHabit);

      return await apiService.habits.updateHabit(id, payload);
    },
    onSuccess: () => {
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
    mutationKey: [...queryKeys.habits.list(), "delete"],
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      return await apiService.habits.deleteHabit(id);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });

      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      if (previousHabits) {
        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          previousHabits.filter((habit) => habit.id !== id),
        );
      }

      return { previousHabits };
    },
    onError: (error, _id, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits.list(),
          context.previousHabits,
        );
      }
      console.error("Error deleting habit:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
  });
}

// Mutation hook for incrementing habit progress with optimistic updates
export function useIncrementHabitProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.habits.list(), "increment"],
    mutationFn: async (habit: HabitGoal): Promise<{ success: boolean }> => {
      if (!habit) {
        throw new Error("Habit not found");
      }
      if (habit.isComplete) {
        throw new Error("Habit is already complete");
      }
      const updatedHabit = incrementHabitProgress(habit);
      return await apiService.habits.updateHabit(habit.id, updatedHabit);
    },
    onMutate: async (habit: HabitGoal) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });
      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      const updatedHabit = incrementHabitProgress(habit);

      if (previousHabits) {
        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          previousHabits.map((h) => (h.id === habit.id ? updatedHabit : h)),
        );
      }
      return { previousHabits };
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
    // Don't invalidate queries - optimistic update already reflects the change in UI
    // The server will eventually sync in the background
  });
}

// Mutation hook for completing a habit with optimistic updates
export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.habits.list(), "complete"],
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const currentHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );
      const habit = currentHabits?.find((h) => h.id === id);

      if (!habit) {
        throw new Error("Habit not found");
      }

      const completedHabit = {
        ...habit,
        current: habit.target,
        progress: 100,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };

      return await apiService.habits.updateHabit(id, completedHabit);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });

      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      if (previousHabits) {
        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          previousHabits.map((habit) =>
            habit.id === id && !habit.isComplete ? completeHabit(habit) : habit,
          ),
        );
      }

      return { previousHabits };
    },
    onError: (error, _id, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(
          queryKeys.habits.list(),
          context.previousHabits,
        );
      }
      console.error("Error completing habit:", error);
    },
    // Don't invalidate queries - optimistic update already reflects the change in UI
    // The server will eventually sync in the background
  });
}

// Mutation hook for resetting all habits
export function useResetHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.habits.list(), "reset"],
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
