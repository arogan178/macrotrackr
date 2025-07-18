import { StateCreator } from "zustand";

import type { MacroEntry } from "@/types/macro";

// Simplified macro UI slice for only UI state
export interface MacroUISlice {
  // UI State only
  editingEntry: MacroEntry | undefined;

  // Actions
  setEditingEntry: (entry: MacroEntry | undefined) => void;
}

export const createMacroUISlice: StateCreator<
  MacroUISlice,
  [],
  [],
  MacroUISlice
> = (set) => ({
  // Initial State
  editingEntry: undefined,

  // Actions
  setEditingEntry: (entry) => set({ editingEntry: entry }),
});
