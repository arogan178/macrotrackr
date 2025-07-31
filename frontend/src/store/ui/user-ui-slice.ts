import { StateCreator } from "zustand";

import { validateSettingsComplete as validateSettings } from "@/features/settings/utils/validation";
import { UserSettings } from "@/types/user";

// User UI slice for managing all UI state in the settings page
export interface UserUISlice {
  // Notification function for UI feedback (required, matches NotificationSlice signature)
  showNotification: (
    message: string,
    type?: string,
    options?: {
      duration?: number;
    },
  ) => string;

  // Subscription status for UI (derived from server data)
  subscriptionStatus: "free" | "pro" | "canceled";
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") => void;

  // Form state and UI state only
  settings: UserSettings | undefined;
  originalSettings: UserSettings | undefined;
  hasSettingsChanges: boolean;
  formErrors: Record<string, string>;

  // Form actions
  initializeSettings: (data: { settings: UserSettings }) => void;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  validateSettingsForm: () => boolean;
  resetSettings: () => void;
  clearSettingsMessages: () => void;

  // Weight update for other components that might need it
  updateCurrentUserWeight: (newWeight: number) => void;
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
  settings: undefined,
  originalSettings: undefined,
  formErrors: {},
  hasSettingsChanges: false,

  setSubscriptionStatus: (status: "free" | "pro" | "canceled") =>
    set({ subscriptionStatus: status }),

  initializeSettings: (data) => {
    const { settings } = data;

    set({
      settings,
      originalSettings: structuredClone(settings),
      hasSettingsChanges: false,
      formErrors: {},
    });
  },

  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    set((state: UserUISlice & Record<string, unknown>) => {
      if (!state.settings || !(key in state.settings)) {
        console.warn(`Attempted to update unknown setting key: ${String(key)}`);
        return state;
      }

      const updatedSettings = { ...state.settings, [key]: value };
      const hasChanged = state.originalSettings
        ? JSON.stringify(updatedSettings) !==
          JSON.stringify(state.originalSettings)
        : true;

      return {
        ...state,
        settings: updatedSettings,
        hasSettingsChanges: hasChanged,
      };
    });
  },

  validateSettingsForm: () => {
    const state = get();
    // Sanitize gender property for validation
    const settingsForValidation = state.settings && {
      ...state.settings,
      gender: state.settings.gender === "" ? undefined : state.settings.gender,
    };
    const errors = validateSettings(settingsForValidation);
    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  resetSettings: () => {
    set((state: UserUISlice) => ({
      ...state,
      settings: state.originalSettings
        ? structuredClone(state.originalSettings)
        : undefined,
      hasSettingsChanges: false,
      formErrors: {},
    }));
  },

  clearSettingsMessages: () => {
    // This is now a no-op since messages are handled by TanStack Query
    // Kept for compatibility with existing components
  },

  updateCurrentUserWeight: (newWeight: number) => {
    set((state: UserUISlice) => ({
      ...state,
      settings: state.settings
        ? { ...state.settings, weight: newWeight }
        : undefined,
    }));
  },
});
