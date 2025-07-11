// Type guard to check if an object is Partial<MacroDailyTotals>
import { StateCreator } from "zustand";

import {
  MacroDailyTotals,
  MacroEntry,
  MacroTargetSettings,
} from "@/types/macro";
import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import {
  calculateTodayTotals,
  removeEntryFromList,
  updateEntryInList,
} from "../calculations";
import { AddEntryPayload, UpdateEntryPayload } from "../utilities";

function isPartialMacroDailyTotals(
  object: unknown,
): object is Partial<MacroDailyTotals> {
  if (typeof object !== "object" || object === null) return false;
  const maybe = object as Partial<MacroDailyTotals>;
  return (
    typeof maybe.protein === "number" ||
    typeof maybe.carbs === "number" ||
    typeof maybe.fats === "number" ||
    typeof maybe.calories === "number"
  );
}

// Define the slice interface
export interface MacrosSlice {
  // State
  history: MacroEntry[];
  macroDailyTotals: MacroDailyTotals;
  macroTarget: MacroTargetSettings | undefined;
  editingEntry: MacroEntry | undefined;
  isLoading: boolean;
  isTargetLoading: boolean;
  isSaving: boolean;
  isTargetSaving: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  error: string | undefined;
  targetError: string | undefined;

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
  setEditingEntry: (entry: MacroEntry | undefined) => void;
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
  FullMacrosState,
  [],
  [],
  MacrosSlice
> = (set, get) => ({
  // Initial State
  history: [],
  macroDailyTotals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
  macroTarget: undefined,
  editingEntry: undefined,
  isLoading: false,
  isTargetLoading: false,
  isSaving: false,
  isTargetSaving: false,
  isEditing: false,
  isDeleting: false,
  error: undefined,
  targetError: undefined,

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
      error: undefined,
      targetError: undefined,
    });

    try {
      const [totalsData, historyData, targetResult] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory(),
        apiService.macros.getMacroTarget(),
      ]);

      let formattedTotals: MacroDailyTotals = {
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      };
      if (isPartialMacroDailyTotals(totalsData)) {
        formattedTotals = {
          protein:
            typeof totalsData.protein === "number" ? totalsData.protein : 0,
          carbs: typeof totalsData.carbs === "number" ? totalsData.carbs : 0,
          fats: typeof totalsData.fats === "number" ? totalsData.fats : 0,
          calories:
            typeof totalsData.calories === "number" ? totalsData.calories : 0,
        };
      }

      const percentages =
        targetResult &&
        typeof targetResult === "object" &&
        "macroTarget" in targetResult
          ? (targetResult as { macroTarget?: MacroTargetSettings }).macroTarget
          : undefined;

      set({
        macroDailyTotals: formattedTotals,
        history: Array.isArray(historyData) ? historyData : [],
        macroTarget: percentages,
        isLoading: false,
        isTargetLoading: false,
        error: undefined,
        targetError: undefined,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Fetch macro data error:", error);
      set({ error: errorMessage, isLoading: false, isTargetLoading: false });
      get()._notifyUser(`Failed to load macro data: ${errorMessage}`, "error");
    }
  },

  fetchMacroTarget: async () => {
    set({ isTargetLoading: true, targetError: undefined });
    try {
      const result = await apiService.macros.getMacroTarget();
      const percentages =
        result && typeof result === "object" && "macroTarget" in result
          ? (result as { macroTarget?: MacroTargetSettings }).macroTarget
          : undefined;
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
    set({ isSaving: true, error: undefined });
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
      set({ targetError: "Invalid macro target settings provided." });
      return;
    }

    set({ isTargetSaving: true, targetError: undefined });

    try {
      const payload = { macroTarget: settings };
      const savedTargetResponse =
        await apiService.macros.saveMacroTargetPercentages(payload);

      const macroTarget =
        savedTargetResponse &&
        typeof savedTargetResponse === "object" &&
        "macroTarget" in savedTargetResponse
          ? (savedTargetResponse as { macroTarget?: MacroTargetSettings })
              .macroTarget
          : undefined;
      set({
        macroTarget,
        isTargetSaving: false,
        targetError: undefined,
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

  clearMacroError: () => set({ error: undefined }),
  clearTargetError: () => set({ targetError: undefined }),
});
