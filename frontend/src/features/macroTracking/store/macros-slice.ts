import { StateCreator } from "zustand";
import { apiService } from "@/utils/api-service"; //
import { MacroEntry, MacroDailyTotals, MacroTargetSettings } from "../types"; // Adjust path
import { getErrorMessage } from "@/utils/error-handling"; // Adjust path

// Define the slice interface including new state and actions
export interface MacrosSlice {
  // State
  history: MacroEntry[];
  macroDailyTotals: MacroDailyTotals;
  macroTarget: MacroTargetSettings | null; // State for target percentages
  editingEntry: MacroEntry | null;
  isLoading: boolean; // General loading for fetchMacroData (covers totals, history, target)
  isTargetLoading: boolean; // Specific loading for target fetch (can be redundant if fetchMacroData is always used)
  isSaving: boolean; // Saving daily entry
  isTargetSaving: boolean; // Specific saving for target percentages
  isEditing: boolean; // Editing daily entry
  isDeleting: boolean; // Deleting daily entry
  error: string | null; // General error for entries/totals
  targetError: string | null; // Specific error for target operations

  // Actions
  fetchMacroData: () => Promise<void>; // Fetches totals, history, AND target percentages
  fetchMacroTarget: () => Promise<void>; // Action to fetch only target percentages
  updateMacroTargetPercentages: (
    percentages: MacroTargetSettings
  ) => Promise<void>; // Action to update percentages
  addEntry: (entry: AddEntryPayload) => Promise<void>; // Use specific payload type
  updateEntry: (id: number, entryUpdate: UpdateEntryPayload) => Promise<void>; // Use specific payload type
  deleteEntry: (id: number) => Promise<void>;
  setEditingEntry: (entry: MacroEntry | null) => void;
  clearMacroError: () => void; // Action to clear general error
  clearTargetError: () => void; // Action to clear target-specific error
}

// Define the type for the full state for use with get()
type FullMacrosState = MacrosSlice & {
  // Include methods from other slices if they are accessed via get()
  showNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
};

// Define payload type for addEntry based on MacroEntryCreatePayload from api-service
// Ensure this uses camelCase matching the API service interface
type AddEntryPayload = {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName?: string;
  entry_date: string;
  entry_time: string;
};
// Define update payload type
type UpdateEntryPayload = Partial<AddEntryPayload>;

export const createMacrosSlice: StateCreator<
  MacrosSlice & any,
  [],
  [],
  MacrosSlice
> = (set, get) => ({
  // Initial State
  history: [],
  macroDailyTotals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
  macroTarget: null, // Initialize target state
  editingEntry: null,
  isLoading: false,
  isTargetLoading: false, // Initialize target loading
  isSaving: false,
  isTargetSaving: false, // Initialize target saving
  isEditing: false,
  isDeleting: false,
  error: null,
  targetError: null, // Initialize target error

  // --- Fetch Actions ---
  fetchMacroData: async () => {
    // Fetches totals, history, AND target percentages together
    set({
      isLoading: true,
      isTargetLoading: true,
      error: null,
      targetError: null,
    });
    const fullGet = get as () => FullMacrosState;

    try {
      // Fetch all macro-related data concurrently
      const [totalsData, historyData, targetResult] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory(),
        apiService.macros.getMacroTarget(), // Fetch target percentages via macros API service
      ]);

      const formattedTotals: MacroDailyTotals = {
        protein: totalsData?.protein ?? 0,
        carbs: totalsData?.carbs ?? 0,
        fats: totalsData?.fats ?? 0,
        calories: totalsData?.calories ?? 0,
      };

      // Extract the nested macroTarget object from the API response { macroTarget: { percentages... } }
      const percentages = targetResult?.macroTarget || null;

      set({
        macroDailyTotals: formattedTotals,
        history: historyData || [], // Ensure history is always an array
        macroTarget: percentages, // Set the target percentages state
        isLoading: false,
        isTargetLoading: false, // Clear target loading
        error: null, // Clear errors on successful fetch
        targetError: null,
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Fetch macro data error:", error);
      // Set general error, clear all loading states
      set({ error: errorMessage, isLoading: false, isTargetLoading: false });
      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to load macro data: ${errorMessage}`,
          "error"
        );
      }
    }
  },

  // Action to fetch only macro target percentages
  fetchMacroTarget: async () => {
    set({ isTargetLoading: true, targetError: null });
    const fullGet = get as () => FullMacrosState;
    try {
      const result = await apiService.macros.getMacroTarget(); // Use macros API service
      const percentages = result?.macroTarget || null;
      set({ macroTarget: percentages, isTargetLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching macro target:", error);
      set({ isTargetLoading: false, targetError: errorMessage });
      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to load macro targets: ${errorMessage}`,
          "error"
        );
      }
    }
  },

  // --- Create/Update/Delete Actions for Entries ---
  addEntry: async (inputs: AddEntryPayload): Promise<void> => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullMacrosState;
    try {
      // Payload uses camelCase as defined in AddEntryPayload type
      await apiService.macros.addEntry(inputs);
      // Refetch all macro data (totals, history, target) after successful add
      await fullGet().fetchMacroData();
      if (fullGet().showNotification) {
        fullGet().showNotification("Entry saved successfully!", "success");
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Save entry error:", error);
      set({ error: errorMessage }); // Set general error
      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to save entry: ${errorMessage}`,
          "error"
        );
      }
    } finally {
      set({ isSaving: false });
    }
  },

  updateEntry: async (
    id: number,
    entryUpdate: UpdateEntryPayload
  ): Promise<void> => {
    set({ isEditing: true, error: null });
    const fullGet = get as () => FullMacrosState;
    try {
      // Payload uses camelCase as defined in UpdateEntryPayload type
      await apiService.macros.updateEntry(id, entryUpdate);
      set({ editingEntry: null }); // Clear editing state
      await fullGet().fetchMacroData(); // Refetch all macro data
      if (fullGet().showNotification) {
        fullGet().showNotification("Entry updated successfully", "success");
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Update entry error:", error);
      set({ error: errorMessage, editingEntry: null }); // Clear editing state on error
      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to update entry: ${errorMessage}`,
          "error"
        );
      }
      // Optionally refetch data even on error if optimistic UI was used
      // await fullGet().fetchMacroData();
    } finally {
      set({ isEditing: false });
    }
  },

  deleteEntry: async (id: number) => {
    set({ isDeleting: true, error: null });
    const fullGet = get as () => FullMacrosState;
    try {
      await apiService.macros.deleteEntry(id);
      await fullGet().fetchMacroData(); // Refetch all macro data
      if (fullGet().showNotification) {
        fullGet().showNotification("Entry deleted successfully", "success");
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Delete entry error:", error);
      set({ error: errorMessage });
      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to delete entry: ${errorMessage}`,
          "error"
        );
      }
      // Refetch data to ensure consistency on error
      await fullGet().fetchMacroData();
    } finally {
      set({ isDeleting: false });
    }
  },

  setEditingEntry: (entry) => set({ editingEntry: entry }),

  // --- Action to update only macro target percentages ---
  updateMacroTargetPercentages: async (percentages) => {
    // Ensure percentages is not null, provide default if needed? Or expect valid object.
    if (!percentages) {
      console.error(
        "updateMacroTargetPercentages called with null percentages"
      );
      set({ targetError: "Invalid macro target percentages provided." });
      return;
    }
    set({ isTargetSaving: true, targetError: null }); // Use specific saving/error state
    const fullGet = get as () => FullMacrosState;
    try {
      // Prepare payload expected by apiService { macroTarget: { percentages... } }
      const payload = { macroTarget: percentages };
      // Call the specific API endpoint for percentages (now under macros)
      const savedTargetResponse =
        await apiService.macros.saveMacroTargetPercentages(payload);

      // Update state with the saved/returned percentages object
      set({
        macroTarget: savedTargetResponse?.macroTarget || null, // Extract nested object
        isTargetSaving: false,
        targetError: null,
      });

      if (fullGet().showNotification) {
        fullGet().showNotification(
          "Macro target percentages updated!",
          "success"
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating macro target percentages:", error);
      set({ targetError: errorMessage, isTargetSaving: false });
      if (fullGet().showNotification) {
        fullGet().showNotification(
          `Failed to update macro targets: ${errorMessage}`,
          "error"
        );
      }
    }
  },

  // --- Clear Error Actions ---
  clearMacroError: () => set({ error: null }),
  clearTargetError: () => set({ targetError: null }),
});
