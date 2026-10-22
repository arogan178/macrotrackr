import type { MouseEvent } from "react";

import type { MacroEntry } from "@/types/macro";

/** Day rows and entry rows share these columns, so every split bar and figure
 *  lines up down the list whatever the name, the total or the trailing control. */
export const HISTORY_ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3rem_5rem] items-center gap-3";

/** The desktop history and its ingredient rows: food, split, three macros,
 *  calories, actions. Figures right-align so their digits stack. */
export const DESKTOP_ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4rem_5rem_5rem_5rem_6rem_5rem] items-center gap-4 px-6";

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
  canCopyDate: (date: string) => boolean;
  handleCopyDate: (date: string, event: MouseEvent) => void;

  onEdit: (entry: MacroEntry) => void;
  deleteEntry: (id: string) => void;

  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;
  onLogAgain?: (entry: MacroEntry) => void;
  onCopyOrMove?: (entry: MacroEntry) => void;

  isMealSaved: (entryId: string) => boolean;

  isDeleting: (id: string) => boolean;
  isSelectionMode: boolean;
  isEntrySelected: (id: string) => boolean;
  onToggleEntrySelection?: (id: string) => void;
}
