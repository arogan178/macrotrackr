import { create } from "zustand";
import { createAuthSlice, AuthSlice } from "@/features/auth/store/auth-slice";
import {
  createUserSlice,
  UserSlice,
} from "@/features/settings/store/user-slice";
import {
  createNotificationSlice,
  NotificationSlice,
} from "@/features/notifications/store/notification-slice";
import {
  createMacrosSlice,
  MacrosSlice,
} from "@/features/macroTracking/store/macro-slice";
import {
  createGoalsSlice,
  GoalsSlice,
} from "@/features/goals/store/goals-slice";

// Create a unified store type
type Store = AuthSlice &
  UserSlice &
  NotificationSlice &
  MacrosSlice &
  GoalsSlice;

// Create store with all slices
export const useStore = create<Store>((...a) => ({
  ...createAuthSlice(...a),
  ...createUserSlice(...a),
  ...createNotificationSlice(...a),
  ...createMacrosSlice(...a),
  ...createGoalsSlice(...a),
}));
