import { create } from 'zustand';
import { apiService } from '../utils/api-service';
import { MacroEntry, MacroTotals, UserDetails } from '../types';
import { calculateBMR, calculateTDEE } from '../utils/calculations';

// Define the store's state interface
interface AppState {
  // Data states
  user: UserDetails | null;
  history: MacroEntry[];
  totals: MacroTotals;
  editingEntry: MacroEntry | null;
  
  // Settings-related states
  settings: UserDetails | null;
  originalSettings: UserDetails | null;
  formErrors: Record<string, string>;
  hasSettingsChanges: boolean;
  successMessage: string | null;

  // UI states
  isLoading: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;
  notification: string | null;

  // Computed values
  userMetrics: { bmr: number; tdee: number };
  
  // Actions
  fetchUserDetails: () => Promise<void>;
  fetchMacros: () => Promise<void>;
  addEntry: (entry: { protein: number; carbs: number; fats: number }) => Promise<void>;
  updateEntry: (entry: MacroEntry) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | null) => void;
  clearNotification: () => void;
  clearError: () => void;
  
  // Settings actions
  fetchSettings: () => Promise<void>;
  updateSetting: <K extends keyof UserDetails>(key: K, value: UserDetails[K]) => void;
  validateSettingsForm: () => boolean;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
  clearMessages: () => void;
}

// Define initial state as a separate constant for better organization
const initialState = {
  // Data states
  user: null as UserDetails | null,
  history: [] as MacroEntry[],
  totals: {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0
  } as MacroTotals,
  editingEntry: null as MacroEntry | null,
  
  // Settings-related states
  settings: null as UserDetails | null,
  originalSettings: null as UserDetails | null,
  formErrors: {} as Record<string, string>,
  hasSettingsChanges: false,
  successMessage: null as string | null,
  
  // UI states
  isLoading: false,
  isEditing: false,
  isSaving: false,
  isDeleting: false,
  error: null as string | null,
  notification: null as string | null,
};

/**
 * Helper function to extract error message from different error formats
 * This handles various API error response structures
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object' && error !== null) {
    // Handle API responses that might include error messages in different formats
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') return errorObj.message;
    if (typeof errorObj.error === 'string') return errorObj.error;
    if (typeof errorObj.statusText === 'string') return errorObj.statusText;
  }
  
  return "An unknown error occurred";
}

/**
 * Helper function to set a notification and automatically clear it after a timeout
 */
function setNotificationWithTimeout(
  set: (state: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void,
  message: string, 
  duration: number = 5000
) {
  set({ notification: message });
  
  setTimeout(() => {
    set((state) => {
      // Only clear if the notification hasn't changed
      if (state.notification === message) {
        return { notification: null };
      }
      return {};
    });
  }, duration);
}

// Create the store
export const useAppState = create<AppState>((set, get) => ({
  ...initialState,
  
  // Computed properties
  userMetrics: { bmr: 0, tdee: 0 }, // Initialize with zeros
  
  // Actions
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
        
        // Debug logging
        console.log("Metrics calculated:", { 
          userData, 
          age, 
          bmr, 
          tdee, 
          weight: userData.weight,
          height: userData.height,
          gender: userData.gender,
          activityLevel: userData.activity_level
        });
      }
      
      // Update both user data and metrics atomically
      set({ 
        user: userData,
        userMetrics: { bmr, tdee } 
      });
      
      await get().fetchMacros();
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
  
  fetchMacros: async () => {
    try {
      const [totalsData, historyData] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory()
      ]);
      
      set({
        totals: totalsData,
        history: historyData
      });
    } catch (error) {
      console.error("Fetch macros error:", error);
      set({ error: getErrorMessage(error) });
    }
  },
  
  addEntry: async (inputs) => {
    set({ isSaving: true, error: null });

    try {
      await apiService.macros.addEntry(inputs);
      await get().fetchMacros();
      
      // Use helper function for notification management
      setNotificationWithTimeout(set, "Entry saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      set({ error: getErrorMessage(error) });
    } finally {
      set({ isSaving: false });
    }
  },
  
  updateEntry: async (updatedEntry) => {
    set({ isEditing: true, error: null });
    
    try {
      const { id, protein, carbs, fats } = updatedEntry;
      
      // Optimistic UI update
      const { history } = get();
      const updatedHistory = history.map(entry => 
        entry.id === id ? { ...entry, protein, carbs, fats } : entry
      );
      
      set({ history: updatedHistory });
      
      // Make API call
      await apiService.macros.updateEntry(id, { protein, carbs, fats });
      
      // Reset editing state and refresh macros to get accurate totals
      set({ editingEntry: null });
      await get().fetchMacros();
      
      // Use helper function for notification management
      setNotificationWithTimeout(set, "Entry updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      set({ error: getErrorMessage(error) });
      
      // Refresh data to revert optimistic update on error
      get().fetchMacros();
    } finally {
      set({ isEditing: false });
    }
  },
  
  deleteEntry: async (id) => {
    set({ isDeleting: true, error: null });
    
    try {
      const { history, totals } = get();
      
      // Find the entry before deleting for optimistic UI update
      const deletedEntry = history.find((entry) => entry.id === id);
      const today = new Date().toDateString();
      
      // Update UI immediately (optimistic update)
      const newHistory = history.filter((entry) => entry.id !== id);
      set({ history: newHistory });
      
      // If the entry is from today, update totals optimistically
      if (deletedEntry && new Date(deletedEntry.created_at).toDateString() === today) {
        const newTotals = {
          protein: totals.protein - deletedEntry.protein,
          carbs: totals.carbs - deletedEntry.carbs,
          fats: totals.fats - deletedEntry.fats,
          calories: totals.calories - (
            deletedEntry.protein * 4 + 
            deletedEntry.carbs * 4 + 
            deletedEntry.fats * 9
          )
        };
        
        set({ totals: newTotals });
      }
      
      // Make the API call
      await apiService.macros.deleteEntry(id);
      
      // Use helper function for notification management
      setNotificationWithTimeout(set, "Entry deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      set({ error: getErrorMessage(error) });
      
      // Refresh data to restore state if API call failed
      await get().fetchMacros();
    } finally {
      set({ isDeleting: false });
    }
  },
  
  // Settings actions
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
        formErrors: {}
      });
    } catch (error) {
      console.error("Fetch settings error:", error);
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },
  
  updateSetting: (key, value) => {
    const { settings, originalSettings } = get();
    if (!settings || !originalSettings) return;
    
    // Update the specific setting
    const updatedSettings = { ...settings, [key]: value };
    
    // Check if there are any changes compared to original
    const hasChanges = Object.keys(updatedSettings).some(k => {
      const settingKey = k as keyof UserDetails;
      return JSON.stringify(updatedSettings[settingKey]) !== JSON.stringify(originalSettings[settingKey]);
    });
    
    set({ 
      settings: updatedSettings,
      hasSettingsChanges: hasChanges
    });
  },
  
  validateSettingsForm: () => {
    const { settings } = get();
    const errors: Record<string, string> = {};
    
    if (!settings) return false;
    
    // Basic validation rules
    if (!settings.first_name?.trim()) {
      errors.first_name = "First name is required";
    }
    
    if (!settings.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(settings.email)) {
      errors.email = "Invalid email format";
    }
    
    if (settings.height && (isNaN(settings.height) || settings.height <= 0)) {
      errors.height = "Height must be a positive number";
    }
    
    if (settings.weight && (isNaN(settings.weight) || settings.weight <= 0)) {
      errors.weight = "Weight must be a positive number";
    }
    
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
        successMessage: "Settings saved successfully"
      });
      
      // Refresh user details to update the main app state
      await get().fetchUserDetails();
      
      // Remove the auto-clear timeout - let the FloatingNotification handle this
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
      formErrors: {}
    });
  },
  
  clearMessages: () => {
    set({ error: null, successMessage: null });
  },
  
  setEditingEntry: (entry) => set({ editingEntry: entry }),
  
  clearNotification: () => set({ notification: null }),
  
  clearError: () => set({ error: null })
}));

// Note: For state persistence across page reloads, consider adding zustand/middleware
// Example:
// import { persist } from 'zustand/middleware';
// export const useAppState = create(
//   persist(
//     (set, get) => ({ ...store }),
//     { name: 'macro-tracker-storage' }
//   )
// );
