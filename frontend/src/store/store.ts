import { create } from "zustand";
import { createUserSlice, UserSlice } from "./userStore";
import { createMacrosSlice, MacrosSlice } from "./macroStore";
import { createAuthSlice, AuthSlice } from "./authStore";
import { createUISlice, UISlice } from "./uiStore";
import { devtools } from "zustand/middleware";

// Combine all slices into one store
type Store = UserSlice & MacrosSlice & AuthSlice & UISlice;

// Create the store with all slices and devtools for better debugging
export const useStore = create<Store>()(
  devtools(
    (...a) => ({
      ...createUserSlice(...a),
      ...createMacrosSlice(...a),
      ...createAuthSlice(...a),
      ...createUISlice(...a),
    }),
    { name: "macro-tracker-store" }
  )
);

// Initialize auth-related persistence
if (typeof window !== "undefined") {
  // Restore auth state from localStorage if available
  const token = localStorage.getItem("token");
  if (token) {
    // Fetch user data when app initializes with valid token
    setTimeout(() => {
      useStore.getState().fetchUserDetails?.();
    }, 0);
  }
}
