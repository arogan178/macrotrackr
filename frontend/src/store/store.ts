import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { AuthUISlice, createAuthUISlice } from "@/store/ui/auth-ui-slice";
import { createGoalsUISlice, GoalsUISlice } from "@/store/ui/goals-ui-slice";
import { createMacroUISlice, MacroUISlice } from "@/store/ui/macro-ui-slice";
import {
  createNotificationSlice,
  NotificationSlice,
} from "@/store/ui/notifications-slice";
import { createUserUISlice, UserUISlice } from "@/store/ui/user-ui-slice";

// Combine all slice types (removed HabitsSlice, GoalsSlice, and MacrosSlice - kept UI slices for UI state)
export type StoreState = UserUISlice &
  AuthUISlice &
  GoalsUISlice &
  MacroUISlice &
  NotificationSlice;

// Create the store with all slices (removed createHabitsSlice, createGoalsSlice, and createMacrosSlice - kept UI slices for UI state)
export const useStore = create<StoreState>()(
  devtools((...a) => ({
    ...createUserUISlice(...a),
    ...createAuthUISlice(...a),
    ...createGoalsUISlice(...a),
    ...createMacroUISlice(...a),
    ...createNotificationSlice(...a),
  })),
);

// If you need to reset slices for testing, implement a reset method in each slice and call them here.
// Example:
// export const resetStore = () => {
//   useStore.setState((state) => ({ ...state, ...initialState }));
// };
