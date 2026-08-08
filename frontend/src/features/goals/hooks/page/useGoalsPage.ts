import type { HabitGoalFormValues } from "@/types/habit";

import { useGoalsData } from "./useGoalsData";
import { useGoalsMutations } from "./useGoalsMutations";
import { useGoalsUiState } from "./useGoalsUiState";

export function useGoalsController() {
  const ui = useGoalsUiState();
  const data = useGoalsData();
  const mutations = useGoalsMutations();

  const actions = {
    openWeightGoalModal: () => ui.setWeightGoalModalOpen(true),
    closeWeightGoalModal: () => ui.setWeightGoalModalOpen(false),
    closeLogWeightModal: () => ui.setLogWeightModalOpen(false),
    closeResetGoalsModal: () => ui.setResetModalOpen(false),
    addHabit: () => ui.openHabitModal(undefined, "add"),
    editHabit: (id: string) => {
      const habitToEdit = data.habits?.find((h) => h.id === id);
      if (habitToEdit) {
        ui.openHabitModal(habitToEdit, "edit");
      }
    },
    closeHabitModal: () => ui.closeHabitModal(),
    submitHabit: async (values: HabitGoalFormValues, habitId?: string) => {
      await mutations.submitHabit(values, habitId, ui.habitModalMode);
      ui.closeHabitModal();
    },
    openDeleteConfirmModal: () => ui.setDeleteConfirmModalOpen(true),
    closeDeleteConfirmModal: () => ui.setDeleteConfirmModalOpen(false),
    deleteWeightGoalConfirmed: async () => {
      await mutations.deleteWeightGoal();
      ui.setDeleteConfirmModalOpen(false);
    },
    incrementHabit: async (id: string) => {
      const originalHabit = data.habits.find((h) => h.id === id);
      if (!originalHabit) throw new Error("Habit not found");
      await mutations.incrementHabit(originalHabit);
    },
    completeHabit: async (id: string) => {
      await mutations.completeHabit(id);
    },
    deleteHabit: async (id: string) => {
      await mutations.deleteHabit(id);
    },
  };

  return { ui, data, actions };
}
