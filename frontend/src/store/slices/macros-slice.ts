import { StateCreator } from 'zustand';
import { apiService } from '../../utils/api-service';
import { MacroEntry, MacroTotals } from '../../types';
import { getErrorMessage, setNotificationWithTimeout } from '../../utils/error-handling';

export interface MacrosSlice {
  // State
  history: MacroEntry[];
  totals: MacroTotals;
  editingEntry: MacroEntry | null;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  error: string | null;
  notification: string | null;
  
  // Actions
  fetchMacros: () => Promise<void>;
  addEntry: (entry: { protein: number; carbs: number; fats: number }) => Promise<void>;
  updateEntry: (entry: MacroEntry) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | null) => void;
  clearNotification: () => void;
}

export const createMacrosSlice: StateCreator<MacrosSlice & any> = (set, get) => ({
  history: [],
  totals: {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0
  },
  editingEntry: null,
  isLoading: false,
  isSaving: false,
  isEditing: false,
  isDeleting: false,
  error: null,
  notification: null,
  
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
      
      // Use imported helper function for notification management
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
      
      // Use imported helper function for notification management
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
      
      // Use imported helper function for notification management
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
  
  setEditingEntry: (entry) => set({ editingEntry: entry }),
  
  clearNotification: () => set({ notification: null }),
});
