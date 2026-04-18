import type { HabitGoalFormValues } from "@/types/habit";

import type { useGoalsData } from "./useGoalsData";
import { useGoalsMutations } from "./useGoalsMutations";
import type { useGoalsUiState } from "./useGoalsUiState";

type GoalsUiState = ReturnType<typeof useGoalsUiState>;
type GoalsData = ReturnType<typeof useGoalsData>;

export function useGoalsActions(ui: GoalsUiState, data: GoalsData) {
  const mutations = useGoalsMutations();

  function openWeightGoalModal() {
    ui.setWeightGoalModalOpen(true);
  }

  function closeWeightGoalModal() {
    ui.setWeightGoalModalOpen(false);
  }

  function closeLogWeightModal() {
    ui.setLogWeightModalOpen(false);
  }

  function closeResetGoalsModal() {
    ui.setResetModalOpen(false);
  }

  function addHabit() {
    ui.openHabitModal(undefined, "add");
  }

  function editHabit(id: string) {
    const habitToEdit = data.habits?.find((h) => h.id === id);
    if (habitToEdit) {
      ui.openHabitModal(habitToEdit, "edit");
    }
  }

  function closeHabitModal() {
    ui.closeHabitModal();
  }

  async function submitHabit(values: HabitGoalFormValues, habitId?: string) {
    await mutations.submitHabit(values, habitId, ui.habitModalMode);
    ui.closeHabitModal();
  }

  function openDeleteConfirmModal() {
    ui.setDeleteConfirmModalOpen(true);
  }

  function closeDeleteConfirmModal() {
    ui.setDeleteConfirmModalOpen(false);
  }

  async function deleteWeightGoalConfirmed() {
    await mutations.deleteWeightGoal();
    closeDeleteConfirmModal();
  }

  async function incrementHabit(id: string) {
    const originalHabit = data.habits.find((h) => h.id === id);
    if (!originalHabit) throw new Error("Habit not found");
    await mutations.incrementHabit(originalHabit);
  }

  async function completeHabit(id: string) {
    await mutations.completeHabit(id);
  }

  async function deleteHabit(id: string) {
    await mutations.deleteHabit(id);
  }

  return {
    openWeightGoalModal,
    closeWeightGoalModal,
    closeLogWeightModal,
    closeResetGoalsModal,
    addHabit,
    editHabit,
    closeHabitModal,
    submitHabit,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    deleteWeightGoalConfirmed,
    incrementHabit,
    completeHabit,
    deleteHabit,
  };
}
