import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createUserSlice, UserSlice } from "./user-slice";
import { createMacrosSlice, MacrosSlice } from "./macro-slice";
import { createAuthSlice, AuthSlice } from "./auth-slice";
import { createUISlice, UISlice } from "./ui-slice";

// Define the combined store type
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
    // Set authentication state immediately
    useStore.setState({ isAuthenticated: true });

    // Fetch user details and settings when app initializes with valid token
    setTimeout(() => {
      const store = useStore.getState();
      store.fetchUserDetails();
      store.fetchSettings();
    }, 0);
  }
}
