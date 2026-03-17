import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type HabitGoalUpdatePayload,habitsApi } from "@/api/habits";
import {
  buildHabitUpdatePayload,
  completeHabit,
  createNewHabit,
  incrementHabitProgress,
  updateHabitFromForm,
} from "@/features/goals/utils/habits";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { HabitGoal, HabitGoalFormValues } from "@/types/habit";

interface HabitMutationContext {
  previousHabits?: HabitGoal[];
}

export const habitsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.habits.list(),
    queryFn: (): Promise<HabitGoal[]> => habitsApi.getHabits(),
    ...queryConfigs.longLived,
  });

export function useHabits() {
  return useQuery(habitsQueryOptions());
}

// Mutation hook for adding a new habit
export function useAddHabit() {
  const queryClient = useQueryClient();
  const logAddHabitError = createMutationErrorLogger("Error adding habit");

  return useMutation({
    mutationKey: [...queryKeys.habits.list(), "add"],
    mutationFn: async (values: HabitGoalFormValues): Promise<HabitGoal> => {
      const newHabit = createNewHabit(values);

      return await habitsApi.saveHabit(newHabit);
    },
    onSuccess: () => {
      // Invalidate and refetch habits list
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
    onError: logAddHabitError,
  });
}

// Mutation hook for updating a habit
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const logUpdateHabitError = createMutationErrorLogger("Error updating habit");

  return useMutation<
    HabitGoal,
    Error,
    { id: string; values: HabitGoalFormValues }
  >({
    mutationKey: [...queryKeys.habits.list(), "update"],
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: HabitGoalFormValues;
    }): Promise<HabitGoal> => {
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

      return await habitsApi.updateHabit(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
    onError: logUpdateHabitError,
  });
}
// Mutation hook for deleting a habit with optimistic updates
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const logDeleteHabitError = createMutationErrorLogger("Error deleting habit");

  return useMutation<
    { success: boolean },
    Error,
    string,
    HabitMutationContext
  >({
    mutationKey: [...queryKeys.habits.list(), "delete"],
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      return await habitsApi.deleteHabit(id);
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
      logDeleteHabitError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
  });
}

// Mutation hook for incrementing habit progress with optimistic updates
export function useIncrementHabitProgress() {
  const queryClient = useQueryClient();
  const logIncrementHabitError = createMutationErrorLogger(
    "Error incrementing habit progress",
  );

  return useMutation<HabitGoal, Error, HabitGoal, HabitMutationContext>({
    mutationKey: [...queryKeys.habits.list(), "increment"],
    mutationFn: async (habit: HabitGoal): Promise<HabitGoal> => {
      if (habit.isComplete) {
        throw new Error("Habit is already complete");
      }
      const updatedHabit = incrementHabitProgress(habit);
      const payload: HabitGoalUpdatePayload = {
        title: updatedHabit.title,
        iconName: updatedHabit.iconName,
        current: updatedHabit.current,
        target: updatedHabit.target,
        accentColor: updatedHabit.accentColor,
        isComplete: updatedHabit.isComplete,
        createdAt: updatedHabit.createdAt,
        completedAt: updatedHabit.completedAt,
      };

      return await habitsApi.updateHabit(habit.id, payload);
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
      logIncrementHabitError(error);
    },
    // Don't invalidate queries - optimistic update already reflects the change in UI
    // The server will eventually sync in the background
  });
}

// Mutation hook for completing a habit with optimistic updates
export function useCompleteHabit() {
  const queryClient = useQueryClient();
  const logCompleteHabitError = createMutationErrorLogger(
    "Error completing habit",
  );

  return useMutation<HabitGoal, Error, string, HabitMutationContext>({
    mutationKey: [...queryKeys.habits.list(), "complete"],
    mutationFn: async (id: string): Promise<HabitGoal> => {
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

      const payload: HabitGoalUpdatePayload = {
        title: completedHabit.title,
        iconName: completedHabit.iconName,
        current: completedHabit.current,
        target: completedHabit.target,
        accentColor: completedHabit.accentColor,
        isComplete: completedHabit.isComplete,
        createdAt: completedHabit.createdAt,
        completedAt: completedHabit.completedAt,
      };

      return await habitsApi.updateHabit(id, payload);
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
      logCompleteHabitError(error);
    },
    // Don't invalidate queries - optimistic update already reflects the change in UI
    // The server will eventually sync in the background
  });
}

// Mutation hook for resetting all habits
export function useResetHabits() {
  const queryClient = useQueryClient();
  const logResetHabitsError = createMutationErrorLogger("Error resetting habits");

  return useMutation({
    mutationKey: [...queryKeys.habits.list(), "reset"],
    mutationFn: async (): Promise<{ success: boolean; count: number }> => {
      return await habitsApi.resetHabit();
    },
    onSuccess: () => {
      // Clear the habits cache and refetch
      queryClient.setQueryData<HabitGoal[]>(queryKeys.habits.list(), []);
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
    },
    onError: logResetHabitsError,
  });
}
