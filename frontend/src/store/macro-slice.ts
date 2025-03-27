import { StateCreator } from "zustand";
import { apiService } from "../utils/api-service";
import { MacroEntry, MacroTotals } from "../../types";
import { getErrorMessage } from "../utils/error-handling";

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

  // Actions
  fetchMacros: () => Promise<void>;
  addEntry: (entry: {
    protein: number;
    carbs: number;
    fats: number;
  }) => Promise<void>;
  updateEntry: (entry: MacroEntry) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | null) => void;
}

export const createMacrosSlice: StateCreator<MacrosSlice & any> = (
  set,
  get
) => ({
  history: [],
  totals: {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  },
  editingEntry: null,
  isLoading: false,
  isSaving: false,
  isEditing: false,
  isDeleting: false,
  error: null,

  fetchMacros: async () => {
    set({ isLoading: true, error: null });

    try {
      const [totalsData, historyData] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory(),
      ]);

      set({
        totals: totalsData,
        history: historyData,
        isLoading: false,
      });
    } catch (error) {
      console.error("Fetch macros error:", error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });

      // Show notification if UI slice is available
      if (get().showNotification) {
        get().showNotification(
          `Failed to load macro data: ${errorMessage}`,
          "error"
        );
      }
    }
  },

  addEntry: async (inputs) => {
    set({ isSaving: true, error: null });

    try {
      const result = await apiService.macros.addEntry(inputs);
      await get().fetchMacros();

      // Use UI slice for notification management if available
      if (get().showNotification) {
        get().showNotification("Entry saved successfully!", "success");
      }

      return result;
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage });

      // Show notification if UI slice is available
      if (get().showNotification) {
        get().showNotification(
          `Failed to save entry: ${errorMessage}`,
          "error"
        );
      }

      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  updateEntry: async (updatedEntry) => {
    set({ isEditing: true, error: null });

    try {
      const { id, protein, carbs, fats } = updatedEntry;

      // Optimistic UI update for history only
      const { history } = get();
      const updatedHistory = history.map((entry) =>
        entry.id === id ? { ...entry, protein, carbs, fats } : entry
      );

      set({ history: updatedHistory });

      // Make API call
      const result = await apiService.macros.updateEntry(id, {
        protein,
        carbs,
        fats,
      });

      // Reset editing state and refresh macros to get accurate totals
      set({ editingEntry: null });
      await get().fetchMacros();

      // Use UI slice for notification management if available
      if (get().showNotification) {
        get().showNotification("Entry updated successfully", "success");
      }

      return result;
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage });

      // Show notification if UI slice is available
      if (get().showNotification) {
        get().showNotification(
          `Failed to update entry: ${errorMessage}`,
          "error"
        );
      }

      // Refresh data to revert optimistic update on error
      await get().fetchMacros();

      throw error;
    } finally {
      set({ isEditing: false });
    }
  },

  deleteEntry: async (id) => {
    set({ isDeleting: true, error: null });

    try {
      // Only apply optimistic update to history, not totals
      const { history } = get();
      const newHistory = history.filter((entry) => entry.id !== id);
      set({ history: newHistory });

      // Make the API call
      await apiService.macros.deleteEntry(id);

      // Fetch updated totals from the API instead of calculating locally
      await get().fetchMacros();

      // Use UI slice for notification management if available
      if (get().showNotification) {
        get().showNotification("Entry deleted successfully", "success");
      }
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage });

      // Show notification if UI slice is available
      if (get().showNotification) {
        get().showNotification(
          `Failed to delete entry: ${errorMessage}`,
          "error"
        );
      }

      // Refresh data to restore state if API call failed
      await get().fetchMacros();

      throw error;
    } finally {
      set({ isDeleting: false });
    }
  },

  setEditingEntry: (entry) => set({ editingEntry: entry }),
});
