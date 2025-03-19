import { StateCreator } from 'zustand';
import { apiService } from '../../utils/api-service';
import { UserDetails, MacroDistributionSettings } from '../../types';
import { calculateBMR, calculateTDEE } from '../../utils/calculations';
import { getErrorMessage } from '../../utils/error-handling';
import { USER_MINIMUM_AGE } from '../../utils/constants';
import { isOldEnough, validateUserSettings } from '../../utils/validation';

export interface UserSlice {
  // Constants
  USER_MINIMUM_AGE: number;
  
  // User state
  user: UserDetails | null;
  userMetrics: { bmr: number; tdee: number };
  isLoading: boolean;
  error: string | null;
  
  // Settings state
  settings: UserDetails | null;
  originalSettings: UserDetails | null;
  isSettingsLoading: boolean;
  settingsError: string | null;
  settingsSuccess: string | null;
  formErrors: Record<string, string>;
  hasSettingsChanges: boolean;
  
  // User actions
  fetchUserDetails: () => Promise<void>;
  clearError: () => void;
  
  // Settings actions
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserDetails>(key: K, value: UserDetails[K]) => void;
  updateMacroDistribution: (distribution: MacroDistributionSettings) => void;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  clearSettingsMessages: () => void;
  
  // Helper functions
  isOldEnough: (dateOfBirth: string) => boolean;
}

export const createUserSlice: StateCreator<UserSlice & any> = (set, get) => ({
  // Constants
  USER_MINIMUM_AGE,
  
  // User state
  user: null,
  userMetrics: { bmr: 0, tdee: 0 },
  isLoading: false,
  error: null,
  
  // Settings state
  settings: null,
  originalSettings: null, 
  isSettingsLoading: false,
  settingsError: null,
  settingsSuccess: null,
  formErrors: {},
  hasSettingsChanges: false,
  
  // Use imported function instead of redefining
  isOldEnough,
  
  // User actions
  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userData = await apiService.user.getProfile();
      
      // Calculate metrics right after fetching user data
      let bmr = 0;
      let tdee = 0;
      
      if (userData?.weight && userData?.height && userData?.date_of_birth && userData?.gender && userData?.activity_level) {
        const age = new Date().getFullYear() - new Date(userData.date_of_birth).getFullYear();
        bmr = Math.round(calculateBMR(userData.weight, userData.height, age, userData.gender));
        tdee = Math.round(calculateTDEE(bmr, userData.activity_level));
      }
      
      // Update both user data and metrics atomically
      set({ 
        user: userData,
        userMetrics: { bmr, tdee } 
      });
      
      await get().fetchMacros?.();
    } catch (error) {
      console.error("Fetch user error:", error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage });
      
      // If unauthorized, redirect to login
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearError: () => set({ error: null }),
  
  // Settings actions
  fetchSettings: async () => {
    set({ isSettingsLoading: true, settingsError: null });
    
    try {
      const response = await fetch("http://localhost:3000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch settings");
      
      const data = await response.json();
      
      // If no macro distribution is set, provide default values
      if (!data.macro_distribution) {
        data.macro_distribution = {
          proteinPercentage: 30,
          carbsPercentage: 40,
          fatsPercentage: 30
        };
      }
      
      // Ensure gender and activity_level have values
      if (!data.gender) data.gender = "male";
      if (!data.activity_level) data.activity_level = 1;
      
      set({
        settings: data,
        originalSettings: JSON.parse(JSON.stringify(data)), // Deep copy
        hasSettingsChanges: false,
        formErrors: {},
      });
    } catch (error) {
      console.error("Fetch settings error:", error);
      set({ 
        settingsError: error instanceof Error ? error.message : "Failed to load settings" 
      });
    } finally {
      set({ isSettingsLoading: false });
    }
  },
  
  updateSetting: <K extends keyof UserDetails>(key: K, value: UserDetails[K]) => {
    set(state => {
      if (!state.settings) return state;
      
      const newSettings = { ...state.settings, [key]: value };
      
      // Check for changes against original settings
      let hasChanges = false;
      if (state.originalSettings) {
        const keys = Object.keys(newSettings) as Array<keyof UserDetails>;
        
        hasChanges = keys.some(k => {
          // Special handling for macro_distribution object
          if (k === 'macro_distribution') {
            if (!state.originalSettings?.macro_distribution) return true;
            
            const origDist = state.originalSettings.macro_distribution;
            const newDist = newSettings.macro_distribution;
            
            return (
              newDist?.proteinPercentage !== origDist?.proteinPercentage ||
              newDist?.carbsPercentage !== origDist?.carbsPercentage ||
              newDist?.fatsPercentage !== origDist?.fatsPercentage
            );
          }
          
          return JSON.stringify(newSettings[k]) !== JSON.stringify(state.originalSettings?.[k]);
        });
      }
      
      return { 
        settings: newSettings,
        hasSettingsChanges: hasChanges
      };
    });
  },
  
  updateMacroDistribution: (distribution: MacroDistributionSettings) => {
    set(state => {
      if (!state.settings) return state;
      
      const newSettings = {
        ...state.settings,
        macro_distribution: distribution
      };
      
      // Check if macro distribution changed
      let hasChanges = state.hasSettingsChanges;
      
      if (state.originalSettings?.macro_distribution) {
        const origDist = state.originalSettings.macro_distribution;
        
        const macroChanged = 
          distribution.proteinPercentage !== origDist.proteinPercentage ||
          distribution.carbsPercentage !== origDist.carbsPercentage ||
          distribution.fatsPercentage !== origDist.fatsPercentage;
          
        // If macro distribution changed or other settings changed
        hasChanges = macroChanged || hasChanges;
      } else {
        // Original has no macro distribution, so this is a change
        hasChanges = true;
      }
      
      return { 
        settings: newSettings,
        hasSettingsChanges: hasChanges
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
    if (!state.settings || !state.validateSettingsForm()) return;
    
    set({ isSettingsLoading: true, settingsError: null, settingsSuccess: null });
    
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
        macro_distribution: state.settings.macro_distribution
      };
      
      const response = await fetch("http://localhost:3000/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update settings");
      }
      
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // Update original settings after successful save
      set({ 
        originalSettings: JSON.parse(JSON.stringify(state.settings)),
        hasSettingsChanges: false,
        settingsSuccess: "Settings updated successfully!"
      });
      
      // Show notification if UI slice is available
      if (state.showNotification) {
        state.showNotification("Settings updated successfully!", "success");
      }
      
      // Refresh user details to update any dependent data
      await state.fetchUserDetails();
    } catch (error) {
      console.error("Save settings error:", error);
      set({ 
        settingsError: error instanceof Error ? error.message : "Failed to update settings"
      });
      
      // Show error notification if UI slice is available
      if (state.showNotification) {
        state.showNotification(
          error instanceof Error ? error.message : "Failed to update settings", 
          "error"
        );
      }
    } finally {
      set({ isSettingsLoading: false });
    }
  },
  
  resetSettings: () => {
    set(state => {
      if (!state.originalSettings) return state;
      
      return {
        settings: JSON.parse(JSON.stringify(state.originalSettings)),
        hasSettingsChanges: false,
        formErrors: {}
      };
    });
  },
  
  clearSettingsMessages: () => {
    set({ settingsError: null, settingsSuccess: null });
  }
});
