import { StateCreator } from "zustand";

import {
  createNutritionProfile,
  createUserSettings,
} from "@/features/settings/utils/calculations";
import { MacroTargetSettings } from "@/types/macro";
import { UserNutritionalProfile, UserSettings } from "@/types/user"; // Unified import
import { apiService } from "@/utils/apiServices";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";
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
  // Optional notification function for UI feedback
  showNotification?: (message: string, type: "success" | "error") => void;
  // Core user data
  user: UserSettings | undefined;
  nutritionProfile: UserNutritionalProfile | undefined;
  macroTarget: MacroTargetSettings | undefined;

  // Subscription
  subscriptionStatus: "free" | "pro" | "canceled";
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") => void;

  // Loading states
  isLoading: boolean;
  isSettingsLoading: boolean;
  isSaving: boolean;
  isTargetSaving: boolean;

  // Error and success states
  error: string | undefined;
  settingsError: string | undefined;
  settingsSuccess: string | undefined;
  formErrors: Record<string, string>;

  // Settings form state
  settings: UserSettings | undefined;
  settingsMacroTarget: MacroTargetSettings | undefined;
  originalSettings: UserSettings | undefined;
  originalSettingsMacroTarget: MacroTargetSettings | undefined;
  hasSettingsChanges: boolean;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  // Actions
  fetchUserDetails: () => Promise<void>;
  clearError: () => void;
  fetchSettings: () => Promise<void>;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  updateMacroTargetSettings: (
    macroTarget: MacroTargetSettings,
  ) => Promise<boolean>;
  resetSettings: () => void;
  clearSettingsMessages: () => void;
  updateCurrentUserWeight: (newWeight: number) => void;
}

export const createUserSlice: StateCreator<
  UserSlice & Record<string, unknown>,
  [],
  [],
  UserSlice
> = (set, get) => ({
  // Initial state
  user: undefined,
  nutritionProfile: undefined,
  macroTarget: DEFAULT_MACRO_TARGET,
  subscriptionStatus: "free",
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") =>
    set({ subscriptionStatus: status }),
  isLoading: false,
  error: undefined,
  settings: undefined,
  settingsMacroTarget: DEFAULT_MACRO_TARGET,
  originalSettings: undefined,
  originalSettingsMacroTarget: undefined,
  isSettingsLoading: false,
  isSaving: false,
  isTargetSaving: false,
  settingsError: undefined,
  settingsSuccess: undefined,
  formErrors: {},
  hasSettingsChanges: false,

  fetchUserDetails: async () => {
    set({ isLoading: true, error: undefined });
    const fullGet = get as () => UserSlice & Record<string, unknown>;

    try {
      const userData = await apiService.user.getUserDetails();
      if (!userData) {
        throw new Error("User profile data not found after API call.");
      }

      const userSettings = createUserSettings(userData);
      const nutritionProfile = createNutritionProfile(userSettings);

      // Subscription status (from userData, fallback to 'free')
      const allowedStatuses = ["free", "pro", "canceled"] as const;
      const status =
        typeof (userData as unknown as { subscriptionStatus?: unknown })
          .subscriptionStatus === "string"
          ? (userData as unknown as { subscriptionStatus: string })
              .subscriptionStatus
          : undefined;
      const subscriptionStatus =
        status &&
        allowedStatuses.includes(status as "free" | "pro" | "canceled")
          ? (status as "free" | "pro" | "canceled")
          : "free";

      // Fetch macro target separately
      try {
        const macroTargetResponse = await apiService.macros.getMacroTarget();
        const fetchedMacroTarget =
          macroTargetResponse?.macroTarget || DEFAULT_MACRO_TARGET;

        set({
          user: userSettings,
          nutritionProfile,
          macroTarget: fetchedMacroTarget,
          subscriptionStatus,
          isLoading: false,
          error: undefined,
        });
      } catch (macroError) {
        console.error("Error fetching macro target:", macroError);
        set({
          user: userSettings,
          nutritionProfile,
          macroTarget: get().macroTarget || DEFAULT_MACRO_TARGET,
          subscriptionStatus,
          isLoading: false,
          error: undefined,
        });
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
        user: undefined,
        nutritionProfile: undefined,
        macroTarget: undefined,
        subscriptionStatus: "free",
      });

      const notify = fullGet().showNotification;
      if (typeof notify === "function") {
        notify(`Failed to load user data: ${errorMessage}`, "error");
      }
    }
  },

  fetchSettings: async () => {
    set({ isSettingsLoading: true, settingsError: undefined });
    try {
      const data = await apiService.user.getUserDetails();
      if (!data) {
        throw new Error("Failed to fetch settings data.");
      }

      const settings = createUserSettings(data);
      const macroTargetSettings = data.macroTarget || DEFAULT_MACRO_TARGET;

      set({
        settings,
        settingsMacroTarget: macroTargetSettings,
        originalSettings: structuredClone(settings),
        originalSettingsMacroTarget: structuredClone(macroTargetSettings),
        hasSettingsChanges: false,
        formErrors: {},
        isSettingsLoading: false,
      });
    } catch (error) {
      console.error("Fetch settings error:", error);
      set({ settingsError: getErrorMessage(error), isSettingsLoading: false });
    }
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

  updateMacroTargetSettings: async (macroTarget: MacroTargetSettings) => {
    const state = get();
    set({ isTargetSaving: true, settingsError: undefined });

    try {
      await apiService.macros.saveMacroTargetPercentages({ macroTarget });

      const macroTargetCloned = structuredClone(macroTarget);

      set({
        originalSettingsMacroTarget: macroTargetCloned,
        settingsMacroTarget: macroTargetCloned,
        macroTarget: macroTargetCloned,
        hasSettingsChanges: false,
        isTargetSaving: false,
        settingsSuccess: "Macro targets updated successfully!",
      });

      if (state.showNotification) {
        state.showNotification("Macro targets saved successfully!", "success");
      }

      return true;
    } catch (error) {
      console.error("Save macro targets error:", error);
      const errorMessage = getErrorMessage(error);

      set({
        settingsError: errorMessage,
        isTargetSaving: false,
      });

      if (state.showNotification) {
        state.showNotification(
          `Failed to save macro targets: ${errorMessage}`,
          "error",
        );
      }

      return false;
    }
  },

  resetSettings: () => {
    set((state: UserSlice) => ({
      ...state,
      settings: state.originalSettings
        ? structuredClone(state.originalSettings)
        : undefined,
      settingsMacroTarget: state.originalSettingsMacroTarget
        ? structuredClone(state.originalSettingsMacroTarget)
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
