import { StateCreator } from "zustand";

import type { HabitGoal } from "@/types/habit";

// Tab type for goals page
export type GoalsTabType = "goals" | "macro targets";

// Habit modal mode type
export type HabitModalMode = "add" | "edit";

// Goals UI slice for managing all UI state in the goals page
export interface GoalsUISlice {
  // Tab state
  activeTab: GoalsTabType;

  // Modal states
  isResetModalOpen: boolean;
  isHabitModalOpen: boolean;
  currentHabit: HabitGoal | undefined;
  habitModalMode: HabitModalMode;
  isWeightGoalModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  isLogWeightModalOpen: boolean;

  // Tab actions
  setActiveTab: (tab: GoalsTabType) => void;

  // Modal actions
  setResetModalOpen: (open: boolean) => void;
  setHabitModalOpen: (open: boolean) => void;
  setCurrentHabit: (habit: HabitGoal | undefined) => void;
  setHabitModalMode: (mode: HabitModalMode) => void;
  setWeightGoalModalOpen: (open: boolean) => void;
  setDeleteConfirmModalOpen: (open: boolean) => void;
  setLogWeightModalOpen: (open: boolean) => void;

  // Convenience actions for common operations
  openHabitModal: (habit?: HabitGoal, mode?: HabitModalMode) => void;
  closeHabitModal: () => void;
  closeAllModals: () => void;
}

export const createGoalsUISlice: StateCreator<
  GoalsUISlice,
  [],
  [],
  GoalsUISlice
> = (set) => ({
  // Initial State
  activeTab: "goals",
  isResetModalOpen: false,
  isHabitModalOpen: false,
  currentHabit: undefined,
  habitModalMode: "add",
  isWeightGoalModalOpen: false,
  isDeleteConfirmModalOpen: false,
  isLogWeightModalOpen: false,

  // Tab actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modal actions
  setResetModalOpen: (open) => set({ isResetModalOpen: open }),
  setHabitModalOpen: (open) => set({ isHabitModalOpen: open }),
  setCurrentHabit: (habit) => set({ currentHabit: habit }),
  setHabitModalMode: (mode) => set({ habitModalMode: mode }),
  setWeightGoalModalOpen: (open) => set({ isWeightGoalModalOpen: open }),
  setDeleteConfirmModalOpen: (open) => set({ isDeleteConfirmModalOpen: open }),
  setLogWeightModalOpen: (open) => set({ isLogWeightModalOpen: open }),

  // Convenience actions
  openHabitModal: (habit, mode = "add") =>
    set({
      isHabitModalOpen: true,
      currentHabit: habit,
      habitModalMode: mode,
    }),

  closeHabitModal: () =>
    set({
      isHabitModalOpen: false,
      currentHabit: undefined,
      habitModalMode: "add",
    }),

  closeAllModals: () =>
    set({
      isResetModalOpen: false,
      isHabitModalOpen: false,
      currentHabit: undefined,
      habitModalMode: "add",
      isWeightGoalModalOpen: false,
      isDeleteConfirmModalOpen: false,
      isLogWeightModalOpen: false,
    }),
});
