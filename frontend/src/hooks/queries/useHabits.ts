import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type HabitProgressAction, habitsApi } from "@/api/habits";
import {
  buildHabitUpdatePayload,
  completeHabit,
  createNewHabit,
  incrementHabitProgress,
  resetHabitProgress,
  updateHabitFromForm,
} from "@/features/goals/utils/habits";
import { broadcastLocalDataChange } from "@/hooks/useRealtimeSync";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { HabitGoal, HabitGoalFormValues } from "@/types/habit";
import { todayISO } from "@/utils/dateUtilities";

interface HabitMutationContext {
  previousHabits?: HabitGoal[];
}

export const habitsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.habits.list(),
    // Progress is daily in the user's timezone, so the server needs the local date.
    queryFn: (): Promise<HabitGoal[]> => habitsApi.getHabits(todayISO()),
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
      broadcastLocalDataChange("habits");
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

      const updatedHabit = updateHabitFromForm(existingHabit, values);

      if (updatedHabit.target < updatedHabit.current) {
        throw new Error("Target cannot be lower than current progress");
      }

      const payload = buildHabitUpdatePayload(existingHabit, updatedHabit);

      return await habitsApi.updateHabit(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
      broadcastLocalDataChange("habits");
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
      broadcastLocalDataChange("habits");
    },
  });
}

const applyProgressAction: Record<
  HabitProgressAction,
  (habit: HabitGoal) => HabitGoal
> = {
  increment: (habit) => incrementHabitProgress(habit),
  decrement: (habit) => incrementHabitProgress(habit, -1),
  reset: resetHabitProgress,
  complete: completeHabit,
};

// Mutation hook for changing today's habit progress with optimistic updates
export function useHabitProgress() {
  const queryClient = useQueryClient();
  const logHabitProgressError = createMutationErrorLogger(
    "Error updating habit progress",
  );

  return useMutation<
    HabitGoal,
    Error,
    { id: string; action: HabitProgressAction },
    HabitMutationContext
  >({
    mutationKey: [...queryKeys.habits.list(), "progress"],
    mutationFn: async ({ id, action }): Promise<HabitGoal> => {
      return await habitsApi.updateHabitProgress(id, action, todayISO());
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.habits.list() });
      const previousHabits = queryClient.getQueryData<HabitGoal[]>(
        queryKeys.habits.list(),
      );

      if (previousHabits) {
        queryClient.setQueryData<HabitGoal[]>(
          queryKeys.habits.list(),
          previousHabits.map((habit) =>
            habit.id === id ? applyProgressAction[action](habit) : habit,
          ),
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
      logHabitProgressError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
      broadcastLocalDataChange("habits");
    },
  });
}
