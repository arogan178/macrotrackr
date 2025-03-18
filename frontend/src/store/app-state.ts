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
}

// Create the store
export const useAppState = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  history: [],
  totals: {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0
  },
  editingEntry: null,
  
  isLoading: false,
  isEditing: false,
  isSaving: false,
  isDeleting: false,
  error: null,
  notification: null,
  
  // Computed properties
  get userMetrics() {
    const { user } = get();
    
    if (!user?.weight || !user?.height || !user?.date_of_birth || !user?.gender || !user?.activity_level) {
      return { bmr: 0, tdee: 0 };
    }

    const age = new Date().getFullYear() - new Date(user.date_of_birth).getFullYear();
    const bmr = Math.round(calculateBMR(user.weight, user.height, age, user.gender));
    const tdee = calculateTDEE(bmr, user.activity_level);

    return { bmr, tdee };
  },
  
  // Actions
  fetchUserDetails: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userData = await apiService.user.getProfile();
      set({ user: userData });
      await get().fetchMacros();
    } catch (error) {
      console.error("Fetch user error:", error);
      set({ error: error instanceof Error ? error.message : "Failed to load user data" });
      
      // If unauthorized, redirect to login
      if (error instanceof Error && error.message.includes('401')) {
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
      set({ error: error instanceof Error ? error.message : "Failed to load nutrition data" });
    }
  },
  
  addEntry: async (inputs) => {
    set({ isSaving: true, error: null });

    try {
      await apiService.macros.addEntry(inputs);
      await get().fetchMacros();
      
      // Show success notification
      set({ notification: "Entry saved successfully!" });
      
      // Auto-clear notification after 5 seconds
      setTimeout(() => {
        set((state) => state.notification === "Entry saved successfully!" 
          ? { notification: null } 
          : {}
        );
      }, 5000);
    } catch (error) {
      console.error("Save error:", error);
      set({ error: error instanceof Error ? error.message : "Failed to save macro entry" });
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
      
      // Show success notification
      set({ notification: "Entry updated successfully" });
      
      // Auto-clear notification
      setTimeout(() => {
        set((state) => state.notification === "Entry updated successfully" 
          ? { notification: null } 
          : {}
        );
      }, 5000);
    } catch (error) {
      console.error("Update error:", error);
      set({ error: error instanceof Error ? error.message : "Failed to update entry" });
      
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
      
      // Show success notification
      set({ notification: "Entry deleted successfully" });
      
      // Auto-clear notification
      setTimeout(() => {
        set((state) => state.notification === "Entry deleted successfully" 
          ? { notification: null } 
          : {}
        );
      }, 5000);
    } catch (error) {
      console.error("Delete error:", error);
      set({ error: error instanceof Error ? error.message : "Failed to delete entry" });
      
      // Refresh data to restore state if API call failed
      await get().fetchMacros();
    } finally {
      set({ isDeleting: false });
    }
  },
  
  setEditingEntry: (entry) => set({ editingEntry: entry }),
  
  clearNotification: () => set({ notification: null }),
  
  clearError: () => set({ error: null })
}));
