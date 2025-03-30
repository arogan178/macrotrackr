import { create } from "zustand";
import {
  createUserSlice,
  UserSlice,
} from "@/features/settings/store/user-slice";
import { createAuthSlice, AuthSlice } from "@/features/auth/store/auth-slice";
import {
  createMacrosSlice,
  MacrosSlice,
} from "@/features/macroTracking/store/macro-slice";
import {
  createUISlice,
  UISlice,
} from "@/features/notifications/store/ui-slice";
import {
  createGoalsSlice,
  GoalsSlice,
} from "@/features/goals/store/goals-slice";

// Define the store type by combining all slices
export type Store = UserSlice & AuthSlice & MacrosSlice & UISlice & GoalsSlice;

// Create the store with all slices
export const useStore = create<Store>((...args) => ({
  ...createUserSlice(...args),
  ...createAuthSlice(...args),
  ...createMacrosSlice(...args),
  ...createUISlice(...args),
  ...createGoalsSlice(...args),
}));
