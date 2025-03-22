import { StateCreator } from "zustand";
import { apiService } from "../../utils/api-service";
import { UserDetails } from "../../types";
import { getErrorMessage } from "../../utils/error-handling";
import { validateUserSettings } from "../../utils/validation";

// Define the MacroDistribution interface based on its usage in the code
interface MacroDistribution {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  locked_macros: string[];
}

export interface SettingsSlice {
  // State
  settings: UserDetails | null;
  originalSettings: UserDetails | null;
  formErrors: Record<string, string>;
  hasSettingsChanges: boolean;
  successMessage: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserDetails>(
    key: K,
    value: UserDetails[K]
  ) => void;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  clearMessages: () => void;
  updateMacroDistribution: (distribution: MacroDistribution) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice & any> = (
  set,
  get
) => ({
  settings: null,
  originalSettings: null,
  formErrors: {},
  hasSettingsChanges: false,
  successMessage: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      const userData = await apiService.user.getProfile();

      // Make sure userData is correctly typed
      const typedUserData = userData as UserDetails;

      set({
        settings: typedUserData,
        originalSettings: JSON.parse(JSON.stringify(typedUserData)), // Deep copy
        isLoading: false,
        hasSettingsChanges: false,
        formErrors: {},
      });
    } catch (error) {
      console.error("Fetch settings error:", error);
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  updateSetting: (key: keyof UserDetails, value: unknown) => {
    const { settings, originalSettings } = get();
    if (!settings || !originalSettings) return;

    // Update the specific setting
    const updatedSettings = { ...settings, [key]: value };

    // Check if there are any changes compared to original
    const hasChanges = Object.keys(updatedSettings).some((k) => {
      const settingKey = k as keyof UserDetails;
      return (
        JSON.stringify(updatedSettings[settingKey]) !==
        JSON.stringify(originalSettings[settingKey])
      );
    });

    set({
      settings: updatedSettings,
      hasSettingsChanges: hasChanges,
    });
  },

  validateSettingsForm: () => {
    const { settings } = get();
    if (!settings) return false;

    const errors = validateUserSettings(settings);
    set({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  saveSettings: async () => {
    const { settings, validateSettingsForm } = get();

    if (!settings || !validateSettingsForm()) return;

    set({ isSaving: true, error: null });

    try {
      await apiService.user.updateSettings(settings);

      // Update original settings after successful save and set success message
      set({
        originalSettings: JSON.parse(JSON.stringify(settings)),
        hasSettingsChanges: false,
        isSaving: false,
        successMessage: "Settings saved successfully",
      });

      // Refresh user details to update the main app state
      await get().fetchUserDetails?.();
    } catch (error) {
      console.error("Save settings error:", error);
      set({ error: getErrorMessage(error), isSaving: false });
    }
  },

  resetSettings: () => {
    const { originalSettings } = get();
    if (!originalSettings) return;

    set({
      settings: JSON.parse(JSON.stringify(originalSettings)),
      hasSettingsChanges: false,
      formErrors: {},
    });
  },

  clearMessages: () => {
    set({ error: null, successMessage: null });
  },

  updateMacroDistribution: (distribution: MacroDistribution) => {
    set((state: SettingsSlice) => ({
      settings: {
        ...state.settings,
        macro_distribution: distribution,
      },
    }));
  },
});
