import { useStore } from "@/store/store";

export function useGoalsUiState() {
  const {
    activeTab,
    setActiveTab,
    isResetModalOpen,
    setResetModalOpen,
    isHabitModalOpen,
    currentHabit,
    habitModalMode,
    isWeightGoalModalOpen,
    setWeightGoalModalOpen,
    isDeleteConfirmModalOpen,
    setDeleteConfirmModalOpen,
    isLogWeightModalOpen,
    setLogWeightModalOpen,
    openHabitModal,
    closeHabitModal,
    showNotification,
  } = useStore();

  return {
    activeTab,
    setActiveTab,
    isResetModalOpen,
    setResetModalOpen,
    isHabitModalOpen,
    currentHabit,
    habitModalMode,
    isWeightGoalModalOpen,
    setWeightGoalModalOpen,
    isDeleteConfirmModalOpen,
    setDeleteConfirmModalOpen,
    isLogWeightModalOpen,
    setLogWeightModalOpen,
    openHabitModal,
    closeHabitModal,
    showNotification,
  };
}