import { StateCreator } from "zustand";

import type { NotificationType } from "@/components/notifications/NotificationTypes";

// User UI slice for managing all UI state in the settings page
export interface UserUISlice {
  // Notification function for UI feedback (required, matches NotificationSlice signature)
  showNotification: (
    message: string,
    type?: NotificationType,
    options?: {
      duration?: number;
    },
  ) => string;

  // Subscription status for UI (derived from server data)
  subscriptionStatus: "free" | "pro" | "canceled";
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") => void;
}

export const createUserUISlice: StateCreator<
  UserUISlice,
  [],
  [],
  UserUISlice
> = (set, get) => ({
  // Passthrough showNotification implementation to satisfy interface
  showNotification: (message, type, options) => {
    const state = get() as UserUISlice & Record<string, unknown>;
    if (typeof state.showNotification === "function") {
      return state.showNotification(message, type, options);
    }

    return "";
  },

  // Initial UI state only
  subscriptionStatus: "free",

  setSubscriptionStatus: (status: "free" | "pro" | "canceled") =>
    set({ subscriptionStatus: status }),
});
