import { StateCreator } from "zustand";
import { apiService } from "@/utils/api-service";
import { MacroEntry, MacroDailyTotals, MealType } from "../types";
import { getErrorMessage } from "@/utils/error-handling";

export interface MacroSlice {
  // State
  history: MacroEntry[];
  macroDailyTotals: MacroDailyTotals;
  editingEntry: MacroEntry | null;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  error: string | null;

  // Actions
  fetchMacroData: () => Promise<void>; // Renamed from fetchMacros to avoid collision
  addEntry: (entry: {
    protein: number;
    carbs: number;
    fats: number;
    meal_type: MealType;
    meal_name: string;
    entry_date: string;
    entry_time: string;
  }) => Promise<void>;
  updateEntry: (entry: MacroEntry) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | null) => void;
}

export const createMacroSlice: StateCreator<MacroSlice & any> = (set, get) => ({
  history: [],
  macroDailyTotals: {
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

  fetchMacroData: async () => {
    // Renamed from fetchMacros
    set({ isLoading: true, error: null });

    try {
      const [macroDailyTotals, historyData] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory(),
      ]);

      // Properly structure totals data with the expected property names
      const formattedTotals: MacroDailyTotals = {
        protein: macroDailyTotals.protein || 0,
        carbs: macroDailyTotals.carbs || 0,
        fats: macroDailyTotals.fats || 0,
        calories: macroDailyTotals.calories || 0,
      };

      set({
        macroDailyTotals: formattedTotals,
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
      // Send to API with the expected field names from the backend schema
      // and preserve decimal values (no rounding)
      const result = await apiService.macros.addEntry({
        protein: inputs.protein, // Keep decimal value
        carbs: inputs.carbs, // Keep decimal value
        fats: inputs.fats, // Keep decimal value
        meal_type: inputs.meal_type, // Use cleaned meal type string
        meal_name: inputs.meal_name,
        entry_date: inputs.entry_date,
        entry_time: inputs.entry_time,
      });

      await get().fetchMacroData();

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

      // Make API call - preserve decimal values
      const result = await apiService.macros.updateEntry(id, {
        protein, // Keep decimal value
        carbs, // Keep decimal value
        fats, // Keep decimal value
      });

      // Reset editing state and refresh macros to get accurate totals
      set({ editingEntry: null });
      await get().fetchMacroData();

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
      await get().fetchMacroData();

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
      await get().fetchMacroData();

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
      await get().fetchMacroData();

      throw error;
    } finally {
      set({ isDeleting: false });
    }
  },

  setEditingEntry: (entry) => set({ editingEntry: entry }),
});
