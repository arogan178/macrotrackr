import type { HabitGoalFormValues } from "@/features/habits/types/types";

import { useGoalsData } from "./useGoalsData";
import { useGoalsMutations } from "./useGoalsMutations";
import { useGoalsUiState } from "./useGoalsUiState";

export function useGoalsActions() {
  const ui = useGoalsUiState();
  const data = useGoalsData();
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

  function resetGoals() {
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
    resetGoals,
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