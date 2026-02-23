import { useMutationErrorHandler } from "@/hooks";
import { useDeleteWeightGoal } from "@/hooks/queries/useGoals";
import {
  useAddHabit,
  useCompleteHabit,
  useDeleteHabit,
  useIncrementHabitProgress,
  useUpdateHabit,
} from "@/hooks/queries/useHabits";
import { useStore } from "@/store/store";
import type { HabitGoalFormValues } from "@/types/habit";
import type { Habit } from "@/utils/apiServices";

export function useGoalsMutations() {
  const { showNotification } = useStore();
  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const incrementProgressMutation = useIncrementHabitProgress();
  const completeHabitMutation = useCompleteHabit();
  const deleteWeightGoalMutation = useDeleteWeightGoal();

  const { handleMutationError, handleMutationSuccess } = useMutationErrorHandler({
    onError: (message) => showNotification(message, "error"),
    onSuccess: (message) => showNotification(message, "success"),
  });

  async function submitHabit(
    values: HabitGoalFormValues,
    habitId?: string,
    mode?: "add" | "edit",
  ) {
    try {
      if (mode === "edit" && habitId) {
        await updateHabitMutation.mutateAsync({ id: habitId, values });
        handleMutationSuccess("Habit updated successfully!");
      } else {
        await addHabitMutation.mutateAsync(values);
        handleMutationSuccess("Habit added successfully!");
      }
    } catch (error) {
      handleMutationError(error, `${mode === "edit" ? "updating" : "adding"} habit`);
      throw error;
    }
  }

  async function deleteHabit(id: string) {
    try {
      await deleteHabitMutation.mutateAsync(id);
      handleMutationSuccess("Habit deleted successfully");
    } catch (error) {
      handleMutationError(error, "deleting habit");
      throw error;
    }
  }

  async function incrementHabit(originalHabit: HabitGoal) {
    try {
      await incrementProgressMutation.mutateAsync(originalHabit);
      if (originalHabit.current + 1 >= originalHabit.target) {
        handleMutationSuccess(
          `Congratulations! You've completed your ${originalHabit.title}!`,
        );
      }
    } catch (error) {
      handleMutationError(error, "updating habit progress");
      throw error;
    }
  }

  async function completeHabit(id: string) {
    try {
      await completeHabitMutation.mutateAsync(id);
      handleMutationSuccess("Congratulations! You've completed your habit!");
    } catch (error) {
      handleMutationError(error, "completing habit");
      throw error;
    }
  }

  async function deleteWeightGoal() {
    try {
      await deleteWeightGoalMutation.mutateAsync();
      handleMutationSuccess("Weight goal deleted successfully");
    } catch (error) {
      handleMutationError(error, "deleting weight goal");
      throw error;
    }
  }

  return {
    submitHabit,
    deleteHabit,
    incrementHabit,
    completeHabit,
    deleteWeightGoal,
  };
}