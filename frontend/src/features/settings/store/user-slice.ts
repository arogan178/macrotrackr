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
  nutritionProfile: UserNutritionalProfile | null; // This only holds BMR/TDEE now
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
  isTargetSaving: boolean; // New state for macro target saving
  settingsError: string | null;
  settingsSuccess: string | null;
  formErrors: Record<string, string>;
  hasSettingsChanges: boolean;
  // Actions
  fetchUserDetails: () => Promise<void>;
  clearError: () => void;
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(key: K, value: any) => void; // Allow updating user settings only
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  updateMacroTargetPercentages: (
    macroTarget: MacroTargetPercentages
  ) => Promise<boolean>; // New action
  resetSettings: () => void;
  clearSettingsMessages: () => void;

  // --- NEW ACTION for Weight Log ---
  updateCurrentUserWeight: (newWeight: number) => void;
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
  macroTarget: {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  }, // Default macro target (30/40/30)
  isLoading: false,
  error: null,
  settings: null,
  settingsMacroTarget: {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  }, // Default settings macro target
  originalSettings: null,
  originalSettingsMacroTarget: null,
  isSettingsLoading: false,
  isSaving: false,
  isTargetSaving: false, // New state for macro target saving
  settingsError: null,
  settingsSuccess: null,
  formErrors: {},
  hasSettingsChanges: false,

  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => UserSlice & any;

    try {
      // Fetch user profile data (no longer includes macroTarget)
      const userData = await apiService.user.getUserDetails();

      if (!userData) {
        throw new Error("User profile data not found after API call.");
      }

      const age = calculateAge(userData.dateOfBirth);

      let activityLevelNumber = userData.activityLevel;

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

      // Macro target needs to be fetched separately now
      try {
        // Fetch macro target separately using the dedicated endpoint
        const macroTargetResponse = await apiService.macros.getMacroTarget();
        const fetchedMacroTarget = macroTargetResponse?.macroTarget || null;

        // Update state with all fetched data
        set({
          user: userSettings,
          nutritionProfile,
          macroTarget: fetchedMacroTarget, // Store fetched macro target percentages
          isLoading: false,
          error: null,
        });
      } catch (macroError) {
        console.error("Error fetching macro target:", macroError);

        // Still update user and nutrition data even if macro target fetch fails
        set({
          user: userSettings,
          nutritionProfile,
          // Keep existing macro target or default to prevent UI issues
          macroTarget: get().macroTarget,
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

  // Fetch settings data (
  fetchSettings: async () => {
    set({ isSettingsLoading: true, settingsError: null });
    try {
      const data = await apiService.user.getUserDetails();
      if (!data) {
        throw new Error("Failed to fetch settings data.");
      }
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

  // Update a user setting field only (macro targets handled separately)
  updateSetting: (key, value) => {
    set((state) => {
      // Only handle updates to user settings, not macro targets
      let updatedSettings = state.settings ? { ...state.settings } : null;

      // Check if the key belongs to UserSettings
      if (updatedSettings && key in updatedSettings) {
        (updatedSettings as any)[key] = value;

        // Calculate if settings have changed compared to original
        const hasChanged = state.originalSettings
          ? JSON.stringify(updatedSettings) !==
            JSON.stringify(state.originalSettings)
          : updatedSettings !== null;

        return {
          settings: updatedSettings,
          hasSettingsChanges: hasChanged,
          settingsError: null, // Clear error on update
          settingsSuccess: null, // Clear success on update
        };
      } else {
        // Key not found in settings object, do nothing or log warning
        console.warn(`Attempted to update unknown setting key: ${String(key)}`);
        return state; // No change
      }
    });
  },

  validateSettingsForm: () => {
    const state = get();
    // Only validate user settings, not macro targets
    const errors: Record<string, string> = {}; // Placeholder validation
    if (!state.settings?.firstName) errors.firstName = "First name required";
    if (!state.settings?.lastName) errors.lastName = "Last name required";
    // Add more validation rules for user settings fields only

    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  // Save user settings only (no macro targets)
  saveSettings: async () => {
    const state = get();
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
      // Construct payload matching UserSettingsPayload (camelCase, no macroTarget)
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

      // Call API to update settings
      await apiService.user.updateSettings(payload);

      // Update original settings and user state after successful save
      const newOriginalSettings = JSON.parse(JSON.stringify(state.settings));

      // Recalculate nutrition profile based on updated settings
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
        user: newOriginalSettings, // Update main user state
        nutritionProfile: newNutritionProfile, // Update main nutrition profile
        hasSettingsChanges: false, // Only checking user settings changes now
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

  // Save macro target percentages separately via the correct endpoint
  updateMacroTargetPercentages: async (macroTarget: MacroTargetPercentages) => {
    const state = get();
    set({ isTargetSaving: true, settingsError: null });

    try {
      // Use the specific macro target endpoint
      await apiService.macros.saveMacroTargetPercentages({ macroTarget });

      // Update the store after successful save
      const newOriginalMacroTarget = JSON.parse(JSON.stringify(macroTarget));

      set({
        originalSettingsMacroTarget: newOriginalMacroTarget,
        settingsMacroTarget: newOriginalMacroTarget,
        macroTarget: newOriginalMacroTarget, // Also update the main state
        hasSettingsChanges: false, // Reset changes flag
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

  // --- NEW ACTION Implementation ---
  updateCurrentUserWeight: (newWeight) => {
    set((state) => ({
      // Update the weight in the main user object
      user: state.user ? { ...state.user, weight: newWeight } : null,
      // Also update the weight in the settings form state if it exists
      settings: state.settings
        ? { ...state.settings, weight: newWeight }
        : null,
    }));
    // No API call needed here, as the primary weight update happens via goals/weight-log
    // This action just keeps the frontend state consistent.
  },

  // Make sure clearError is defined
  clearError: () => set({ error: null }),
});
