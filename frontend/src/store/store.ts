import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  UserSlice,
  createUserSlice,
} from "@/features/settings/store/user-slice";
import {
  MacroSlice,
  createMacroSlice,
} from "@/features/macroTracking/store/macro-slice";
import {
  GoalsSlice,
  createGoalsSlice,
} from "@/features/goals/store/goals-slice";
import { AuthSlice, createAuthSlice } from "@/features/auth/store/auth-slice";
import {
  NotificationSlice,
  createNotificationSlice,
} from "@/features/notifications/store/notification-slice";

// Combine all slice types
export type StoreState = UserSlice &
  MacroSlice &
  GoalsSlice &
  AuthSlice &
  NotificationSlice;

// Create the store with all slices
export const useStore = create<StoreState>()(
  devtools((...a) => ({
    ...createUserSlice(...a),
    ...createMacroSlice(...a),
    ...createGoalsSlice(...a),
    ...createAuthSlice(...a),
    ...createNotificationSlice(...a),
  }))
);

// Method to reset the entire store for testing purposes
export const resetStore = () => {
  const { reset: resetAuth } = useStore.getState();
  resetAuth();
};
