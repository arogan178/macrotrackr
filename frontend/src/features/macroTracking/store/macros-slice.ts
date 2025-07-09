import { StateCreator } from "zustand";
import { apiService } from "@/utils/api-service";
import {
  MacroEntry,
  MacroDailyTotals,
  MacroTargetSettings,
} from "@/types/macro";

import { getErrorMessage } from "@/utils/error-handling";
import {
  calculateTodayTotals,
  updateEntryInList,
  removeEntryFromList,
} from "../calculations";
import { AddEntryPayload, UpdateEntryPayload } from "../utils";

// Define the slice interface
export interface MacrosSlice {
  // State
  history: MacroEntry[];
  macroDailyTotals: MacroDailyTotals;
  macroTarget: MacroTargetSettings | null;
  editingEntry: MacroEntry | null;
  isLoading: boolean;
  isTargetLoading: boolean;
  isSaving: boolean;
  isTargetSaving: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  error: string | null;
  targetError: string | null;

  // Internal helpers
  _notifyUser: (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;

  // Actions
  fetchMacroData: () => Promise<void>;
  fetchMacroTarget: () => Promise<void>;
  updateMacroTargetSettings: (settings: MacroTargetSettings) => Promise<void>;
  addEntry: (entry: AddEntryPayload) => Promise<void>;
  updateEntry: (id: number, entryUpdate: UpdateEntryPayload) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | null) => void;
  clearMacroError: () => void;
  clearTargetError: () => void;
}

// Define the type for the full state for use with get()
type FullMacrosState = MacrosSlice & {
  showNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
};

export const createMacrosSlice: StateCreator<
  MacrosSlice & any,
  [],
  [],
  MacrosSlice
> = (set, get) => ({
  // Initial State
  history: [],
  macroDailyTotals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
  macroTarget: null,
  editingEntry: null,
  isLoading: false,
  isTargetLoading: false,
  isSaving: false,
  isTargetSaving: false,
  isEditing: false,
  isDeleting: false,
  error: null,
  targetError: null,

  // Helper function to safely call notifications
  _notifyUser: (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => {
    const state = get() as FullMacrosState;
    state.showNotification?.(message, type);
  },

  fetchMacroData: async () => {
    set({
      isLoading: true,
      isTargetLoading: true,
      error: null,
      targetError: null,
    });

    try {
      const [totalsData, historyData, targetResult] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory(),
        apiService.macros.getMacroTarget(),
      ]);

      const formattedTotals: MacroDailyTotals = {
        protein: totalsData?.protein ?? 0,
        carbs: totalsData?.carbs ?? 0,
        fats: totalsData?.fats ?? 0,
        calories: totalsData?.calories ?? 0,
      };

      const percentages = targetResult?.macroTarget || null;

      set({
        macroDailyTotals: formattedTotals,
        history: historyData || [],
        macroTarget: percentages,
        isLoading: false,
        isTargetLoading: false,
        error: null,
        targetError: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Fetch macro data error:", error);
      set({ error: errorMessage, isLoading: false, isTargetLoading: false });
      get()._notifyUser(`Failed to load macro data: ${errorMessage}`, "error");
    }
  },

  fetchMacroTarget: async () => {
    set({ isTargetLoading: true, targetError: null });
    try {
      const result = await apiService.macros.getMacroTarget();
      const percentages = result?.macroTarget || null;
      set({ macroTarget: percentages, isTargetLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching macro target:", error);
      set({ isTargetLoading: false, targetError: errorMessage });
      get()._notifyUser(
        `Failed to load macro targets: ${errorMessage}`,
        "error",
      );
    }
  },

  addEntry: async (inputs: AddEntryPayload): Promise<void> => {
    set({ isSaving: true, error: null });
    try {
      await apiService.macros.addEntry(inputs);
      await get().fetchMacroData();
      get()._notifyUser("Entry saved successfully!", "success");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Save entry error:", error);
      set({ error: errorMessage });
      get()._notifyUser(`Failed to save entry: ${errorMessage}`, "error");
    } finally {
      set({ isSaving: false });
    }
  },

  updateEntry: async (
    id: number,
    entryUpdate: UpdateEntryPayload,
  ): Promise<void> => {
    set({ isEditing: true, error: null });
    const currentHistory = get().history;
    const currentTotals = get().macroDailyTotals;

    try {
      // Optimistic update
      const updatedHistory = updateEntryInList(currentHistory, id, entryUpdate);
      const newTotals = calculateTodayTotals(updatedHistory);

      set({
        history: updatedHistory,
        macroDailyTotals: newTotals,
        editingEntry: null,
      });

      await apiService.macros.updateEntry(id, entryUpdate);
      get()._notifyUser("Entry updated successfully", "success");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Update entry error:", error);

      // Rollback on error
      set({
        history: currentHistory,
        macroDailyTotals: currentTotals,
        error: errorMessage,
        editingEntry: null,
      });

      get()._notifyUser(`Failed to update entry: ${errorMessage}`, "error");
    } finally {
      set({ isEditing: false });
    }
  },

  deleteEntry: async (id: number) => {
    set({ isDeleting: true, error: null });
    const currentHistory = get().history;
    const currentTotals = get().macroDailyTotals;

    try {
      // Optimistic update
      const updatedHistory = removeEntryFromList(currentHistory, id);
      const newTotals = calculateTodayTotals(updatedHistory);

      set({
        history: updatedHistory,
        macroDailyTotals: newTotals,
      });

      await apiService.macros.deleteEntry(id);
      get()._notifyUser("Entry deleted successfully", "success");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Delete entry error:", error);

      // Rollback on error
      set({
        history: currentHistory,
        macroDailyTotals: currentTotals,
        error: errorMessage,
      });

      get()._notifyUser(`Failed to delete entry: ${errorMessage}`, "error");
    } finally {
      set({ isDeleting: false });
    }
  },

  setEditingEntry: (entry) => set({ editingEntry: entry }),

  updateMacroTargetSettings: async (settings) => {
    if (!settings) {
      console.error("updateMacroTargetSettings called with null settings");
      set({ targetError: "Invalid macro target settings provided." });
      return;
    }

    set({ isTargetSaving: true, targetError: null });

    try {
      const payload = { macroTarget: settings };
      const savedTargetResponse =
        await apiService.macros.saveMacroTargetPercentages(payload);

      set({
        macroTarget: savedTargetResponse?.macroTarget || null,
        isTargetSaving: false,
        targetError: null,
      });

      get()._notifyUser("Macro target settings updated!", "success");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating macro target percentages:", error);
      set({ targetError: errorMessage, isTargetSaving: false });
      get()._notifyUser(
        `Failed to update macro targets: ${errorMessage}`,
        "error",
      );
    }
  },

  clearMacroError: () => set({ error: null }),
  clearTargetError: () => set({ targetError: null }),
});
