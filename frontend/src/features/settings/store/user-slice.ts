import { StateCreator } from "zustand";
import { apiService } from "@/utils/api-service";
import { UserSettings, UserNutritionalProfile } from "@/types/user";
import { MacroTargetSettings } from "@/types/macro";
import { getErrorMessage } from "@/utils/error-handling";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";
import {
  createNutritionProfile,
  createUserSettings,
} from "@/features/settings/utils/calculations";
import { validateSettingsComplete as validateSettings } from "../utils/validation";

// Types for API payloads
interface UserSettingsPayload {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activityLevel: number | null;
}

export interface UserSlice {
  // Core user data
  user: UserSettings | null;
  nutritionProfile: UserNutritionalProfile | null;
  macroTarget: MacroTargetSettings | null;

  // Subscription
  subscriptionStatus: "free" | "pro" | "canceled";
  setSubscriptionStatus: (status: "free" | "pro" | "canceled") => void;

  // Loading states
  isLoading: boolean;
  isSettingsLoading: boolean;
  isSaving: boolean;
  isTargetSaving: boolean;

  // Error and success states
  error: string | null;
  settingsError: string | null;
  settingsSuccess: string | null;
  formErrors: Record<string, string>;

  // Settings form state
  settings: UserSettings | null;
  settingsMacroTarget: MacroTargetSettings | null;
  originalSettings: UserSettings | null;
  originalSettingsMacroTarget: MacroTargetSettings | null;
  hasSettingsChanges: boolean;

  // Actions
  fetchUserDetails: () => Promise<void>;
  clearError: () => void;
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: any) => void;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  updateMacroTargetSettings: (
    macroTarget: MacroTargetSettings
  ) => Promise<boolean>;
  resetSettings: () => void;
  clearSettingsMessages: () => void;
  updateCurrentUserWeight: (newWeight: number) => void;
}

export const createUserSlice: StateCreator<
  UserSlice & any,
  [],
  [],
  UserSlice
> = (set, get) => ({
  // Initial state
  user: null,
  nutritionProfile: null,
  macroTarget: DEFAULT_MACRO_TARGET,
  subscriptionStatus: "free",
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  isLoading: false,
  error: null,
  settings: null,
  settingsMacroTarget: DEFAULT_MACRO_TARGET,
  originalSettings: null,
  originalSettingsMacroTarget: null,
  isSettingsLoading: false,
  isSaving: false,
  isTargetSaving: false,
  settingsError: null,
  settingsSuccess: null,
  formErrors: {},
  hasSettingsChanges: false,

  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => UserSlice & any;

    try {
      const userData = await apiService.user.getUserDetails();
      if (!userData) {
        throw new Error("User profile data not found after API call.");
      }

      const userSettings = createUserSettings(userData);
      const nutritionProfile = createNutritionProfile(userSettings);

      // Subscription status (from userData, fallback to 'free')
      const subscriptionStatus = userData.subscriptionStatus || "free";

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
          error: null,
        });
      } catch (macroError) {
        console.error("Error fetching macro target:", macroError);
        set({
          user: userSettings,
          nutritionProfile,
          macroTarget: get().macroTarget || DEFAULT_MACRO_TARGET,
          subscriptionStatus,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
        user: null,
        nutritionProfile: null,
        macroTarget: null,
        subscriptionStatus: "free",
      });

      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to load user data: ${errorMessage}`,
          "error"
        );
      }
    }
  },

  fetchSettings: async () => {
    set({ isSettingsLoading: true, settingsError: null });
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

  updateSetting: (key, value) => {
    set((state: UserSlice) => {
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
        settingsError: null,
        settingsSuccess: null,
      };
    });
  },

  validateSettingsForm: () => {
    const state = get();
    const errors = validateSettings(state.settings);
    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  saveSettings: async () => {
    const state = get();
    if (!state.validateSettingsForm() || !state.settings) {
      set({ settingsError: "Please fix validation errors." });
      return;
    }

    set({ isSaving: true, settingsError: null, settingsSuccess: null });

    try {
      const payload: UserSettingsPayload = {
        firstName: state.settings.firstName,
        lastName: state.settings.lastName,
        email: state.settings.email,
        dateOfBirth: state.settings.dateOfBirth,
        height: state.settings.height,
        weight: state.settings.weight,
        gender: state.settings.gender,
        activityLevel: state.settings.activityLevel,
      };

      await apiService.user.updateSettings(payload);

      const newOriginalSettings = structuredClone(state.settings);
      const newNutritionProfile = createNutritionProfile(state.settings);

      set({
        originalSettings: newOriginalSettings,
        user: newOriginalSettings,
        nutritionProfile: newNutritionProfile,
        hasSettingsChanges: false,
        settingsSuccess: "Settings updated successfully!",
        settingsError: null,
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
          "error"
        );
      }
    }
  },

  updateMacroTargetSettings: async (macroTarget: MacroTargetSettings) => {
    const state = get();
    set({ isTargetSaving: true, settingsError: null });

    try {
      await apiService.macros.saveMacroTargetPercentages({ macroTarget });

      const newOriginalMacroTarget = structuredClone(macroTarget);

      set({
        originalSettingsMacroTarget: newOriginalMacroTarget,
        settingsMacroTarget: newOriginalMacroTarget,
        macroTarget: newOriginalMacroTarget,
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
          "error"
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
        : null,
      settingsMacroTarget: state.originalSettingsMacroTarget
        ? structuredClone(state.originalSettingsMacroTarget)
        : null,
      hasSettingsChanges: false,
      formErrors: {},
      settingsError: null,
      settingsSuccess: null,
    }));
  },

  clearSettingsMessages: () => {
    set({ settingsError: null, settingsSuccess: null });
  },

  updateCurrentUserWeight: (newWeight: number) => {
    set((state: UserSlice) => ({
      ...state,
      user: state.user ? { ...state.user, weight: newWeight } : null,
      settings: state.settings
        ? { ...state.settings, weight: newWeight }
        : null,
    }));
  },

  clearError: () => set({ error: null }),
});
