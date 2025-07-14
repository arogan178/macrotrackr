import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { AuthSlice, createAuthSlice } from "@/features/auth/store/auth-slice";
import {
  createGoalsSlice,
  GoalsSlice,
} from "@/features/goals/store/goals-slice";
import {
  createHabitsSlice,
  HabitsSlice,
} from "@/features/habits/store/habits-slice";
import {
  createMacrosSlice,
  MacrosSlice,
} from "@/features/macroTracking/store/macros-slice";
import {
  createNotificationSlice,
  NotificationSlice,
} from "@/features/notifications/store/notifications-slice";
import {
  createUserSlice,
  UserSlice,
} from "@/features/settings/store/user-slice";

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

// If you need to reset slices for testing, implement a reset method in each slice and call them here.
// Example:
// export const resetStore = () => {
//   useStore.setState((state) => ({ ...state, ...initialState }));
// };
