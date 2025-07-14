import { StateCreator } from "zustand";

import {
  MacroDailyTotals,
  MacroEntry,
  MacroTargetSettings,
  PaginatedMacroHistory,
} from "@/types/macro";
import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import {
  calculateTodayTotals,
  removeEntryFromList,
  updateEntryInList,
} from "../calculations";
import { AddEntryPayload, UpdateEntryPayload } from "../utilities";

// Define the slice interface
export interface MacrosSlice {
  // State
  history: MacroEntry[];
  historyTotal: number;
  historyLimit: number;
  historyOffset: number;
  historyHasMore: boolean;
  macroDailyTotals: MacroDailyTotals;
  editingEntry: MacroEntry | undefined;
  isLoading: boolean;
  isSaving: boolean;
  isTargetSaving: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  error: string | undefined;

  // Internal helpers
  _notifyUser: (message: string, type?: string) => void;

  // Actions
  loadMoreHistory: () => Promise<void>;
  updateMacroTargetSettings: (settings: MacroTargetSettings) => Promise<void>;
  addEntry: (entry: AddEntryPayload) => Promise<void>;
  updateEntry: (id: number, entryUpdate: UpdateEntryPayload) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | undefined) => void;
  clearMacroError: () => void;
}

// Define the type for the full state for use with get()
type FullMacrosState = MacrosSlice & {
  showNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning",
  ) => void;
};

export const createMacrosSlice: StateCreator<
  FullMacrosState,
  [],
  [],
  MacrosSlice
> = (set, get) => ({
  // Initial State
  history: [],
  historyTotal: 0,
  historyLimit: 20,
  historyOffset: 0,
  historyHasMore: true,
  macroDailyTotals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
  editingEntry: undefined,
  isLoading: false,
  isSaving: false,
  isTargetSaving: false,
  isEditing: false,
  isDeleting: false,
  error: undefined,

  // Helper function to safely call notifications
  _notifyUser: (message: string, type?: string) => {
    const state = get() as FullMacrosState;
    if (typeof state.showNotification === "function") {
      state.showNotification(
        message,
        (type as "success" | "error" | "info" | "warning") || "info",
      );
    }
  },

  loadMoreHistory: async () => {
    const { history, historyLimit, historyOffset, historyHasMore } = get();
    if (!historyHasMore) return;
    set({ isLoading: true });
    try {
      const pageRaw = await apiService.macros.getHistory(
        historyLimit,
        historyOffset,
      );
      const page = pageRaw as PaginatedMacroHistory;
      set({
        history: [
          ...history,
          ...(Array.isArray(page.entries) ? page.entries : []),
        ],
        historyTotal: page.total || 0,
        historyLimit: page.limit || historyLimit,
        historyOffset: (page.offset || 0) + (page.entries?.length || 0),
        historyHasMore: !!page.hasMore,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      get()._notifyUser(
        `Failed to load more history: ${errorMessage}`,
        "error",
      );
    }
  },


  addEntry: async (inputs: AddEntryPayload): Promise<void> => {
    set({ isSaving: true, error: undefined });
    try {
      await apiService.macros.addEntry(inputs);
      // fetchMacroData removed; loader now handles macro data refresh
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
    set({ isEditing: true, error: undefined });
    const currentHistory = get().history;
    const currentTotals = get().macroDailyTotals;

    try {
      // Optimistic update
      const updatedHistory = updateEntryInList(currentHistory, id, entryUpdate);
      const newTotals = calculateTodayTotals(updatedHistory);

      set({
        history: updatedHistory,
        macroDailyTotals: newTotals,
        editingEntry: undefined,
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
        editingEntry: undefined,
      });

      get()._notifyUser(`Failed to update entry: ${errorMessage}`, "error");
    } finally {
      set({ isEditing: false });
    }
  },

  deleteEntry: async (id: number) => {
    set({ isDeleting: true, error: undefined });
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
      console.error("updateMacroTargetSettings called with undefined settings");
      return;
    }
    set({ isTargetSaving: true });
    try {
      const payload = { macroTarget: settings };
      await apiService.macros.saveMacroTargetPercentages(payload);
      set({ isTargetSaving: false }); // <-- Fix: always reset after success
      get()._notifyUser("Macro target settings updated!", "success");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating macro target percentages:", error);
      set({ isTargetSaving: false });
      get()._notifyUser(
        `Failed to update macro targets: ${errorMessage}`,
        "error",
      );
    }
  },

  clearMacroError: () => set({ error: undefined }),
});
