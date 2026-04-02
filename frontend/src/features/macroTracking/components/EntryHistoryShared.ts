import type { MouseEvent } from "react";

import type { MacroEntry } from "@/types/macro";

export interface GroupedEntry {
  date: string;
  entries: MacroEntry[];
  totals: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

export interface EntryHistoryController {
  formatDate: (dateString: string) => string;
  formatTimeFromEntry: (entry: MacroEntry) => string;
  capitalizeFirstLetter: (value: string) => string;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;

  isDateCollapsed: (date: string) => boolean;
  toggleDateCollapse: (date: string) => void;
  handleDeleteDate: (date: string, event: MouseEvent) => void;

  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: number) => void;

  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;

  isMealSaved: (entryId: number) => boolean;

  isDeleting: boolean;
  isSelectionMode: boolean;
  isEntrySelected: (id: number) => boolean;
  onToggleEntrySelection?: (id: number) => void;
}
