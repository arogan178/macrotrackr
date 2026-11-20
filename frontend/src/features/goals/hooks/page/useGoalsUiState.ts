import { useShallow } from "zustand/react/shallow";

import { useStore } from "@/store/store";

export function useGoalsUiState() {
  return useStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      setActiveTab: state.setActiveTab,
      isHabitModalOpen: state.isHabitModalOpen,
      currentHabit: state.currentHabit,
      habitModalMode: state.habitModalMode,
      isWeightGoalModalOpen: state.isWeightGoalModalOpen,
      setWeightGoalModalOpen: state.setWeightGoalModalOpen,
      isDeleteConfirmModalOpen: state.isDeleteConfirmModalOpen,
      setDeleteConfirmModalOpen: state.setDeleteConfirmModalOpen,
      isLogWeightModalOpen: state.isLogWeightModalOpen,
      setLogWeightModalOpen: state.setLogWeightModalOpen,
      openHabitModal: state.openHabitModal,
      closeHabitModal: state.closeHabitModal,
      showNotification: state.showNotification,
    })),
  );
}
