import { StateCreator } from "zustand";
import { apiService } from "@/utils/api-service";
import {
  UserSettings,
  UserNutritionalProfile,
  ActivityLevel,
} from "@/features/settings/types";
import {
  calculateBMR,
  calculateTDEE,
  calculateAge,
} from "@/features/settings/calculations";
import { getErrorMessage } from "@/utils/error-handling";
import { validateUserSettings } from "../utils/validation";

export interface UserSlice {
  // User state
  user: UserSettings | null;
  nutritionProfile: UserNutritionalProfile | null;
  isLoading: boolean;
  error: string | null;

  // Settings state
  settings: UserSettings | null;
  nutritionSettings: UserNutritionalProfile | null;
  originalSettings: UserSettings | null;
  originalNutritionSettings: UserNutritionalProfile | null;
  isSettingsLoading: boolean;
  isSaving: boolean;
  settingsError: string | null;
  settingsSuccess: string | null;
  formErrors: Record<string, string>;
  hasSettingsChanges: boolean;

  // User actions
  fetchUserDetails: () => Promise<void>;
  clearError: () => void;

  // Settings actions
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  clearSettingsMessages: () => void;
}

export const createUserSlice: StateCreator<UserSlice & any> = (set, get) => ({
  // User state
  user: null,
  nutritionProfile: null,
  isLoading: false,
  error: null,
  // Settings state
  settings: null,
  nutritionSettings: null,
  originalSettings: null,
  originalNutritionSettings: null,
  isSettingsLoading: false,
  isSaving: false,
  settingsError: null,
  settingsSuccess: null,
  formErrors: {},
  hasSettingsChanges: false,

  // User actions
  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });

    try {
      const userData = await apiService.user.getProfile();
      const age = calculateAge(userData.date_of_birth);

      // Convert activity_level to number if it's a string
      if (
        typeof userData.activity_level === "string" &&
        userData.activity_level
      ) {
        userData.activity_level = getActivityLevelFromString(
          userData.activity_level as ActivityLevel
        );
      }

      // Create a user settings object without nutrition data
      const userSettings: UserSettings = {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        date_of_birth: userData.date_of_birth,
        height: userData.height,
        weight: userData.weight,
        activity_level: userData.activity_level,
        gender: userData.gender,
      };

      // Calculate nutrition metrics
      let bmr = 0;
      let tdee = 0;

      if (
        userData?.weight &&
        userData?.height &&
        userData?.date_of_birth &&
        userData?.gender &&
        userData?.activity_level
      ) {
        bmr = Math.round(
          calculateBMR(userData.weight, userData.height, age, userData.gender)
        );
        tdee = Math.round(calculateTDEE(bmr, userData.activity_level));
      }

      // Create nutrition profile
      const nutritionProfile: UserNutritionalProfile = {
        user_id: userData.id,
        bmr,
        tdee,
        target_calories: userData.target_calories || tdee,
        macro_target: userData.macro_target || {
          proteinPercentage: 30,
          carbsPercentage: 40,
          fatsPercentage: 30,
        },
      };

      // Update both user data and nutrition profile atomically
      set({
        user: userSettings,
        nutritionProfile,
      });

      // Only call fetchMacros if it exists and is a function
      if (typeof get().fetchMacros === "function") {
        await get().fetchMacros();
      }
    } catch (error) {
      console.error("Fetch user error:", error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage });

      // Auth errors will be handled by the auth component or middleware
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  // Settings actions
  fetchSettings: async () => {
    set({ isSettingsLoading: true, settingsError: null });

    try {
      const data = await apiService.user.getProfile();

      // Convert activity_level to number if it's a string
      if (typeof data.activity_level === "string" && data.activity_level) {
        data.activity_level = getActivityLevelFromString(
          data.activity_level as ActivityLevel
        );
      }

      // Create settings object without nutrition data
      const settings: UserSettings = {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        date_of_birth: data.date_of_birth,
        height: data.height,
        weight: data.weight,
        activity_level: data.activity_level || 1,
        gender: data.gender || "male",
      };

      // Calculate nutrition metrics for settings
      const age = calculateAge(data.date_of_birth);
      let bmr = 0;
      let tdee = 0;

      if (
        data?.weight &&
        data?.height &&
        data?.date_of_birth &&
        data?.gender &&
        data?.activity_level
      ) {
        bmr = Math.round(
          calculateBMR(data.weight, data.height, age, data.gender)
        );
        tdee = Math.round(calculateTDEE(bmr, data.activity_level));
      }

      // Create nutrition settings
      const nutritionSettings: UserNutritionalProfile = {
        user_id: data.id,
        bmr,
        tdee,
        target_calories: data.target_calories || tdee,
        macro_target: data.macro_target || {
          proteinPercentage: 30,
          carbsPercentage: 40,
          fatsPercentage: 30,
        },
      };

      set({
        settings,
        nutritionSettings,
        originalSettings: JSON.parse(JSON.stringify(settings)), // Deep copy
        originalNutritionSettings: JSON.parse(
          JSON.stringify(nutritionSettings)
        ), // Deep copy
        hasSettingsChanges: false,
        formErrors: {},
      });
    } catch (error) {
      console.error("Fetch settings error:", error);
      set({
        settingsError: getErrorMessage(error),
      });
    } finally {
      set({ isSettingsLoading: false });
    }
  },

  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    set((state) => {
      if (!state.settings) return state;

      // Create a deep copy and update the setting
      const updatedSettings = JSON.parse(JSON.stringify(state.settings));
      updatedSettings[key] = value;

      // Check for changes against original settings
      let hasChanges = false;
      if (state.originalSettings) {
        const keys = Object.keys(updatedSettings) as Array<keyof UserSettings>;

        hasChanges = keys.some(
          (k) =>
            JSON.stringify(updatedSettings[k]) !==
            JSON.stringify(state.originalSettings?.[k])
        );
      }

      // Check for changes in nutrition settings
      if (state.originalNutritionSettings && state.nutritionSettings) {
        hasChanges = hasChanges || state.hasSettingsChanges;
      }

      return {
        settings: updatedSettings,
        hasSettingsChanges: hasChanges,
      };
    });
  },

  validateSettingsForm: () => {
    const state = get();
    if (!state.settings) return false;

    const errors = validateUserSettings(state.settings);
    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  saveSettings: async () => {
    const state = get();
    if (
      !state.settings ||
      !state.nutritionSettings ||
      !state.validateSettingsForm()
    )
      return;

    set({
      isSettingsLoading: true,
      isSaving: true,
      settingsError: null,
      settingsSuccess: null,
    });

    try {
      const payload = {
        first_name: state.settings.first_name,
        last_name: state.settings.last_name,
        email: state.settings.email,
        date_of_birth: state.settings.date_of_birth,
        height: state.settings.height,
        weight: state.settings.weight,
        gender: state.settings.gender,
        activity_level: state.settings.activity_level,
        // Nutrition data from nutritionSettings
        macro_target: state.nutritionSettings.macro_target,
        target_calories: state.nutritionSettings.target_calories,
      };

      const data = await apiService.user.updateSettings(payload);

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Update original settings after successful save
      set({
        originalSettings: JSON.parse(JSON.stringify(state.settings)),
        originalNutritionSettings: JSON.parse(
          JSON.stringify(state.nutritionSettings)
        ),
        hasSettingsChanges: false,
        settingsSuccess: "Settings updated successfully!",
      });

      // Immediately update user and nutrition profile with new data to avoid needing a refresh
      // Calculate new nutrition metrics based on updated settings
      const age = calculateAge(state.settings.date_of_birth || "");
      let bmr = 0;
      let tdee = 0;

      if (
        state.settings.weight &&
        state.settings.height &&
        state.settings.date_of_birth &&
        state.settings.gender &&
        state.settings.activity_level
      ) {
        bmr = Math.round(
          calculateBMR(
            state.settings.weight,
            state.settings.height,
            age,
            state.settings.gender
          )
        );
        tdee = Math.round(calculateTDEE(bmr, state.settings.activity_level));
      }

      // Update the user profile immediately without a full server fetch
      set({
        user: JSON.parse(JSON.stringify(state.settings)),
        nutritionProfile: {
          ...state.nutritionSettings,
          bmr,
          tdee,
        },
      });

      // Show notification if UI slice is available, but only here to prevent duplicates
      if (state.showNotification) {
        // Use a uniquely identifiable message to help with deduplication
        state.showNotification("Settings saved successfully!", "success", {
          // Add a unique identifier to this notification context
          context: "settings-save",
        });
      }

      // Refresh user details in the background to ensure server consistency
      // But we don't need to wait for it since we've already updated locally
      state.fetchUserDetails().catch(console.error);
    } catch (error) {
      console.error("Save settings error:", error);
      const errorMessage = getErrorMessage(error);
      set({ settingsError: errorMessage });

      // Show error notification if UI slice is available
      if (state.showNotification) {
        state.showNotification(errorMessage, "error");
      }
    } finally {
      set({
        isSettingsLoading: false,
        isSaving: false,
      });
    }
  },

  resetSettings: () => {
    set((state) => {
      if (!state.originalSettings || !state.originalNutritionSettings)
        return state;

      return {
        settings: JSON.parse(JSON.stringify(state.originalSettings)),
        nutritionSettings: JSON.parse(
          JSON.stringify(state.originalNutritionSettings)
        ),
        hasSettingsChanges: false,
        formErrors: {},
      };
    });
  },

  clearSettingsMessages: () => {
    set({ settingsError: null, settingsSuccess: null });
  },
});
