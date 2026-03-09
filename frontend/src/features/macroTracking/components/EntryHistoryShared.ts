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

export interface EntryHistoryHelpers {
  formatDate: (dateString: string) => string;
  formatTimeFromEntry: (entry: MacroEntry) => string;
  capitalizeFirstLetter: (value: string) => string;
  calculateCalories: (protein: number, carbs: number, fats: number) => number;
}

export interface EntryHistoryActions {
  toggleDateCollapse: (date: string) => void;
  handleDeleteDate: (date: string, event: React.MouseEvent) => void;
  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: number) => void;
  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;
}

export interface EntryHistoryState {
  collapsedDates: Set<string>;
  isDeleting: boolean;
  showAllDates?: boolean;
  savedMealIds?: Set<number>;
  isSelectionMode?: boolean;
  selectedEntryIds?: Set<number>;
  onToggleEntrySelection?: (id: number) => void;
}
