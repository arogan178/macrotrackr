import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  UserSlice,
  createUserSlice,
} from "@/features/settings/store/user-slice";
import {
  MacrosSlice,
  createMacrosSlice,
} from "@/features/macroTracking/store/macros-slice";
import {
  GoalsSlice,
  createGoalsSlice,
} from "@/features/goals/store/goals-slice";
import { AuthSlice, createAuthSlice } from "@/features/auth/store/auth-slice";
import {
  NotificationSlice,
  createNotificationSlice,
} from "@/features/notifications/store/notification-slice";
import {
  HabitsSlice,
  createHabitsSlice,
} from "@/features/habits/store/habits-slice";

// Combine all slice types
export type StoreState = UserSlice &
  MacrosSlice &
  GoalsSlice &
  AuthSlice &
  NotificationSlice &
  HabitsSlice;

// Create the store with all slices
export const useStore = create<StoreState>()(
  devtools((...a) => ({
    ...createUserSlice(...a),
    ...createMacrosSlice(...a),
    ...createGoalsSlice(...a),
    ...createAuthSlice(...a),
    ...createNotificationSlice(...a),
    ...createHabitsSlice(...a),
  })),
);

// Method to reset the entire store for testing purposes
export const resetStore = () => {
  const { reset: resetAuth } = useStore.getState();
  resetAuth();
};
