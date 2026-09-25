import { useMutationErrorHandler } from "@/hooks";
import { useDeleteWeightGoal } from "@/hooks/queries/useGoals";
import {
  useAddHabit,
  useDeleteHabit,
  useHabitProgress,
  useUpdateHabit,
} from "@/hooks/queries/useHabits";
import { useStore } from "@/store/store";
import type { HabitGoal, HabitGoalFormValues } from "@/types/habit";

export function useGoalsMutations() {
  const { showNotification } = useStore();
  const addHabitMutation = useAddHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const habitProgressMutation = useHabitProgress();
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
        handleMutationSuccess("Habit updated");
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
      await habitProgressMutation.mutateAsync({
        id: originalHabit.id,
        action: "increment",
      });
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
      await habitProgressMutation.mutateAsync({ id, action: "complete" });
      handleMutationSuccess("Congratulations! You've completed your habit!");
    } catch (error) {
      handleMutationError(error, "completing habit");
      throw error;
    }
  }

  async function decrementHabit(id: string) {
    try {
      await habitProgressMutation.mutateAsync({ id, action: "decrement" });
    } catch (error) {
      handleMutationError(error, "updating habit progress");
      throw error;
    }
  }

  async function resetHabit(id: string) {
    try {
      await habitProgressMutation.mutateAsync({ id, action: "reset" });
    } catch (error) {
      handleMutationError(error, "resetting habit progress");
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
    decrementHabit,
    resetHabit,
    deleteWeightGoal,
  };
}