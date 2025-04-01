// src/features/user/stores/user-slice.ts (Partial - fetchUserDetails & saveSettings)
import { StateCreator } from "zustand";
import { apiService } from "@/utils/api-service";
import {
  UserSettings,
  UserNutritionalProfile, // This type no longer includes targets
  ActivityLevel,
  MacroTargetPercentages, // Use the specific type for percentages
} from "@/features/settings/types"; // Adjust path
import {
  calculateBMR,
  calculateTDEE,
  calculateAge,
} from "@/features/settings/calculations"; // Adjust path
import { getErrorMessage } from "@/utils/error-handling"; // Adjust path
import { validateUserSettings } from "../utils/validation"; // Adjust path

// Define UserSlice interface if not already fully defined
export interface UserSlice {
  user: UserSettings | null;
  // This only holds BMR/TDEE now, based on user_types_corrected
  nutritionProfile: UserNutritionalProfile | null;
  // Macro target percentages might live elsewhere (e.g., goals slice) or directly here
  // Let's add it here for now for simplicity, but consider separating later
  macroTarget: MacroTargetPercentages | null;
  isLoading: boolean;
  error: string | null;
  // Settings related state
  settings: UserSettings | null;
  settingsMacroTarget: MacroTargetPercentages | null; // Separate state for settings form
  originalSettings: UserSettings | null;
  originalSettingsMacroTarget: MacroTargetPercentages | null;
  isSettingsLoading: boolean;
  isSaving: boolean;
  settingsError: string | null;
  settingsSuccess: string | null;
  formErrors: Record<string, string>;
  hasSettingsChanges: boolean;
  // Actions
  fetchUserDetails: () => Promise<void>;
  clearError: () => void;
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings | keyof MacroTargetPercentages>(
    key: K,
    value: any
  ) => void; // Allow updating both
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  clearSettingsMessages: () => void;
}

export const createUserSlice: StateCreator<
  UserSlice & any,
  [],
  [],
  UserSlice
> = (set, get) => ({
  // Initial states...
  user: null,
  nutritionProfile: null,
  macroTarget: null, // Initialize macroTarget state
  isLoading: false,
  error: null,
  settings: null,
  settingsMacroTarget: null, // Initialize settings macroTarget
  originalSettings: null,
  originalSettingsMacroTarget: null,
  isSettingsLoading: false,
  isSaving: false,
  settingsError: null,
  settingsSuccess: null,
  formErrors: {},
  hasSettingsChanges: false,

  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => UserSlice & any;

    try {
      // Fetch combined user data (profile + macro target percentages)
      const userData = await apiService.user.getProfile(); // API now returns macroTarget

      if (!userData) {
        throw new Error("User profile data not found after API call.");
      }

      const age = calculateAge(userData.dateOfBirth);

      let activityLevelNumber = userData.activityLevel;
      // No need to convert activityLevel here if UserSettings type uses number
      // if (typeof userData.activityLevel === "string" && userData.activityLevel) {
      //   activityLevelNumber = getActivityLevelFromString(userData.activityLevel as ActivityLevel);
      // }

      const userSettings: UserSettings = {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        dateOfBirth: userData.dateOfBirth,
        height: userData.height,
        weight: userData.weight,
        activityLevel: activityLevelNumber, // Should be number | null
        gender: userData.gender,
      };

      let bmr = 0;
      let tdee = 0;
      if (
        userSettings.weight &&
        userSettings.height &&
        userSettings.dateOfBirth &&
        userSettings.gender &&
        activityLevelNumber
      ) {
        bmr = Math.round(
          calculateBMR(
            userSettings.weight,
            userSettings.height,
            age,
            userSettings.gender
          )
        );
        tdee = Math.round(calculateTDEE(bmr, activityLevelNumber));
      }

      // Create nutrition profile (BMR/TDEE only) based on corrected type
      const nutritionProfile: UserNutritionalProfile = {
        userId: userData.id,
        bmr,
        tdee,
      };

      // Extract macro target percentages from the response
      const fetchedMacroTarget: MacroTargetPercentages | null =
        userData.macroTarget || null;

      // Update state
      set({
        user: userSettings,
        nutritionProfile,
        macroTarget: fetchedMacroTarget, // Store fetched macro target percentages
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Fetch user error:", error);
      const errorMessage = getErrorMessage(error);
      set({
        error: errorMessage,
        isLoading: false,
        user: null,
        nutritionProfile: null,
        macroTarget: null,
      });

      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to load user data: ${errorMessage}`,
          "error"
        );
      }
    }
  },

  // --- Settings Actions ---

  // Fetch settings data (similar to fetchUserDetails but populates settings state)
  fetchSettings: async () => {
    set({ isSettingsLoading: true, settingsError: null });
    try {
      const data = await apiService.user.getProfile(); // Fetch combined data
      if (!data) {
        throw new Error("Failed to fetch settings data.");
      }

      // Separate user settings from macro target for the form state
      const settings: UserSettings = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        activityLevel: data.activityLevel, // Should be number | null
        gender: data.gender,
      };
      const macroTargetSettings: MacroTargetPercentages | null =
        data.macroTarget || null;

      set({
        settings,
        settingsMacroTarget: macroTargetSettings,
        originalSettings: JSON.parse(JSON.stringify(settings)), // Deep copy
        originalSettingsMacroTarget: JSON.parse(
          JSON.stringify(macroTargetSettings)
        ), // Deep copy
        hasSettingsChanges: false,
        formErrors: {},
        isSettingsLoading: false,
      });
    } catch (error) {
      console.error("Fetch settings error:", error);
      set({ settingsError: getErrorMessage(error), isSettingsLoading: false });
    }
  },

  // Update a setting field (either user setting or macro target setting)
  updateSetting: (key, value) => {
    set((state) => {
      let hasChanged = false;
      let updatedSettings = state.settings ? { ...state.settings } : null;
      let updatedMacroTarget = state.settingsMacroTarget
        ? { ...state.settingsMacroTarget }
        : null;

      // Check if the key belongs to UserSettings
      if (updatedSettings && key in updatedSettings) {
        (updatedSettings as any)[key] = value;
        // Compare with originalSettings
        if (state.originalSettings) {
          hasChanged =
            JSON.stringify(updatedSettings) !==
            JSON.stringify(state.originalSettings);
        }
      }
      // Check if the key belongs to MacroTargetPercentages
      else if (updatedMacroTarget && key in updatedMacroTarget) {
        (updatedMacroTarget as any)[key] = value;
        // Compare with originalSettingsMacroTarget
        if (state.originalSettingsMacroTarget) {
          hasChanged =
            hasChanged ||
            JSON.stringify(updatedMacroTarget) !==
              JSON.stringify(state.originalSettingsMacroTarget);
        } else {
          hasChanged = true; // Changed from null
        }
      } else {
        // Key not found in either settings object, do nothing or log warning
        console.warn(`Attempted to update unknown setting key: ${String(key)}`);
        return state; // No change
      }

      // Ensure comparison includes both parts if they exist
      const macroTargetChanged = state.originalSettingsMacroTarget
        ? JSON.stringify(updatedMacroTarget) !==
          JSON.stringify(state.originalSettingsMacroTarget)
        : updatedMacroTarget !== null; // Changed if it was null before

      return {
        settings: updatedSettings,
        settingsMacroTarget: updatedMacroTarget,
        // Update hasSettingsChanges based on comparison of both parts
        hasSettingsChanges:
          (state.originalSettings
            ? JSON.stringify(updatedSettings) !==
              JSON.stringify(state.originalSettings)
            : updatedSettings !== null) || macroTargetChanged,
        settingsError: null, // Clear error on update
        settingsSuccess: null, // Clear success on update
      };
    });
  },

  validateSettingsForm: () => {
    const state = get();
    // Combine settings and macroTarget for validation if needed, or validate separately
    const settingsToValidate = {
      ...state.settings,
      macroTarget: state.settingsMacroTarget,
    };
    // Assuming validateUserSettings handles the combined structure or needs adjustment
    // const errors = validateUserSettings(settingsToValidate);
    const errors: Record<string, string> = {}; // Placeholder validation
    if (!state.settings?.firstName) errors.firstName = "First name required";
    if (!state.settings?.lastName) errors.lastName = "Last name required";
    // Add more validation rules for all fields, including macroTarget percentages if needed

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  // Save combined settings
  saveSettings: async () => {
    const state = get();
    // Add validation check
    if (!state.validateSettingsForm()) {
      console.warn("Settings validation failed.");
      set({ settingsError: "Please fix validation errors." }); // Provide feedback
      return;
    }
    // Ensure settings exist before saving
    if (!state.settings) {
      console.error("Attempted to save settings when state.settings is null.");
      set({ settingsError: "Cannot save settings, data missing." });
      return;
    }

    set({ isSaving: true, settingsError: null, settingsSuccess: null });

    try {
      // Construct payload matching UserSettingsPayload (camelCase, includes macroTarget)
      const payload: UserSettingsPayload = {
        firstName: state.settings.firstName,
        lastName: state.settings.lastName,
        email: state.settings.email,
        dateOfBirth: state.settings.dateOfBirth,
        height: state.settings.height,
        weight: state.settings.weight,
        gender: state.settings.gender,
        activityLevel: state.settings.activityLevel,
        // Use the macroTarget state being edited in the form
        macroTarget: state.settingsMacroTarget,
      };

      // Call API to update settings
      await apiService.user.updateSettings(payload);

      // Update original settings and user state after successful save
      const newOriginalSettings = JSON.parse(JSON.stringify(state.settings));
      const newOriginalMacroTarget = JSON.parse(
        JSON.stringify(state.settingsMacroTarget)
      );

      // Update main user state as well
      const age = calculateAge(state.settings.dateOfBirth || "");
      let bmr = 0,
        tdee = 0;
      if (
        state.settings.weight &&
        state.settings.height &&
        state.settings.dateOfBirth &&
        state.settings.gender &&
        state.settings.activityLevel
      ) {
        bmr = Math.round(
          calculateBMR(
            state.settings.weight,
            state.settings.height,
            age,
            state.settings.gender
          )
        );
        tdee = Math.round(calculateTDEE(bmr, state.settings.activityLevel));
      }
      const newNutritionProfile: UserNutritionalProfile = {
        userId: state.settings.id,
        bmr,
        tdee,
      };

      set({
        originalSettings: newOriginalSettings,
        originalSettingsMacroTarget: newOriginalMacroTarget,
        user: newOriginalSettings, // Update main user state
        nutritionProfile: newNutritionProfile, // Update main nutrition profile
        macroTarget: newOriginalMacroTarget, // Update main macro target state
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

  resetSettings: () => {
    set((state) => {
      // Reset to original fetched values
      return {
        settings: state.originalSettings
          ? JSON.parse(JSON.stringify(state.originalSettings))
          : null,
        settingsMacroTarget: state.originalSettingsMacroTarget
          ? JSON.parse(JSON.stringify(state.originalSettingsMacroTarget))
          : null,
        hasSettingsChanges: false,
        formErrors: {},
        settingsError: null,
        settingsSuccess: null,
      };
    });
  },

  clearSettingsMessages: () => {
    set({ settingsError: null, settingsSuccess: null });
  },

  // Make sure clearError is defined
  clearError: () => set({ error: null }),
});
