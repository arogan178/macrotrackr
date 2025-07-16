import { StateCreator } from "zustand";

import { createNutritionProfile } from "@/features/settings/utils/calculations";
import { UserNutritionalProfile, UserSettings } from "@/types/user"; // Unified import
import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import { validateSettingsComplete as validateSettings } from "../utils/validation";

// Types for API payloads
interface UserSettingsPayload {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | undefined;
  height: number | undefined;
  weight: number | undefined;
  gender: "male" | "female" | undefined;
  activityLevel: number | undefined;
}

export interface UserSlice {
  // Notification function for UI feedback (required, matches NotificationSlice signature)
  showNotification: (
    message: string,
    type?: string,
    options?: {
      duration?: number;
    },
  ) => string;
  // Core user data
  user: UserSettings | undefined;
  nutritionProfile: UserNutritionalProfile | undefined;
  // Action to set nutrition profile directly (for loader hydration)
  setNutritionProfile: (profile: UserNutritionalProfile | undefined) => void;
  // Action to initialize settings from loader data
  initializeSettings: (data: {
    settings: UserSettings;
  }) => void;

  // Subscription
  subscriptionStatus: "free" | "pro" | "canceled";
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") => void;
  subscription:
    | {
        status: "free" | "pro" | "canceled";
        hasStripeCustomer: boolean;
        currentPeriodEnd: string | undefined;
      }
    | undefined;

  // Loading states
  isSettingsLoading: boolean;
  isSaving: boolean;

  // Error and success states
  error: string | undefined;
  settingsError: string | undefined;
  settingsSuccess: string | undefined;
  formErrors: Record<string, string>;

  // Settings form state
  settings: UserSettings | undefined;
  originalSettings: UserSettings | undefined;
  hasSettingsChanges: boolean;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  // Actions
  clearError: () => void;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  clearSettingsMessages: () => void;
  updateCurrentUserWeight: (newWeight: number) => void;
}

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (
  set,
  get,
) => ({
  // Passthrough showNotification implementation to satisfy interface
  showNotification: (message, type, options) => {
    const state = get() as UserSlice & Record<string, unknown>;
    if (typeof state.showNotification === "function") {
      return state.showNotification(message, type, options);
    }
    return "";
  },
  // Initial state
  user: undefined,
  nutritionProfile: undefined,
  subscriptionStatus: "free",
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") =>
    set({ subscriptionStatus: status }),
  subscription: undefined,
  isLoading: false,
  error: undefined,
  settings: undefined,
  originalSettings: undefined,
  isSettingsLoading: false,
  isSaving: false,
  settingsError: undefined,
  settingsSuccess: undefined,
  formErrors: {},
  hasSettingsChanges: false,

  setNutritionProfile: (profile) => set({ nutritionProfile: profile }),

  initializeSettings: (data) => {
    const { settings } = data;
    const nutritionProfile = createNutritionProfile(settings);
    
    set({
      settings,
      user: settings,
      nutritionProfile,
      originalSettings: structuredClone(settings),
      hasSettingsChanges: false,
      formErrors: {},
      isSettingsLoading: false,
      settingsError: undefined,
    });
  },

  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    set((state: UserSlice & Record<string, unknown>) => {
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
        settingsError: undefined,
        settingsSuccess: undefined,
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

  saveSettings: async () => {
    const state = get();
    if (!state.validateSettingsForm() || !state.settings) {
      set({ settingsError: "Please fix validation errors." });
      return;
    }

    set({
      isSaving: true,
      settingsError: undefined,
      settingsSuccess: undefined,
    });

    try {
      const payload: UserSettingsPayload = {
        firstName: state.settings.firstName,
        lastName: state.settings.lastName,
        email: state.settings.email,
        dateOfBirth: state.settings.dateOfBirth,
        height: state.settings.height,
        weight: state.settings.weight,
        gender:
          state.settings.gender === "" ? undefined : state.settings.gender,
        activityLevel: state.settings.activityLevel,
      };

      await apiService.user.updateSettings(payload);

      const originalSettingsCloned = structuredClone(state.settings);
      const nutritionProfileCloned = createNutritionProfile({
        ...state.settings,
        gender:
          state.settings.gender === "" ? undefined : state.settings.gender,
      });

      set({
        originalSettings: originalSettingsCloned,
        user: originalSettingsCloned,
        nutritionProfile: nutritionProfileCloned,
        hasSettingsChanges: false,
        settingsSuccess: "Settings updated successfully!",
        settingsError: undefined,
        isSaving: false,
      });

      if (state.showNotification) {
        state.showNotification("Settings saved successfully!", "success");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      const errorMessage = getErrorMessage(error);
      set({ settingsError: errorMessage, isSaving: false });

      if (state.showNotification) {
        state.showNotification(
          `Failed to save settings: ${errorMessage}`,
          "error",
        );
      }
    }
  },



  resetSettings: () => {
    set((state: UserSlice) => ({
      ...state,
      settings: state.originalSettings
        ? structuredClone(state.originalSettings)
        : undefined,
      hasSettingsChanges: false,
      formErrors: {},
      settingsError: undefined,
      settingsSuccess: undefined,
    }));
  },

  clearSettingsMessages: () => {
    set({ settingsError: undefined, settingsSuccess: undefined });
  },

  updateCurrentUserWeight: (newWeight: number) => {
    set((state: UserSlice) => ({
      ...state,
      user: state.user ? { ...state.user, weight: newWeight } : undefined,
      settings: state.settings
        ? { ...state.settings, weight: newWeight }
        : undefined,
    }));
  },

  clearError: () => set({ error: undefined }),
});
