/**
 * Macro Tracking Feature Public API
 *
 * Expose only the stable surface intended for external consumption.
 * Internal modules should be imported via relative paths within this feature.
 */

// Constants
export {
  DEFAULT_MACRO_TOTALS,
  getMealTypeDisplay,
  getTodayDateString,
  MEAL_TYPE_OPTIONS,
} from "./constants";

// Calculations (domain math and aggregation)
export {
  calculateCaloriesFromMacros,
  calculateCarbsCalories,
  calculateEntryCalories,
  calculateFatsCalories,
  calculateProteinCalories,
  calculateTodayTotals,
  getTodayEntries,
} from "./calculations";

// Utilities (list ops, formatting, validation, state helpers)
export {
  AddEntryForm,
  DailySummaryPanel,
  EditModal,
  EntryHistoryPanel,
  SavedMealButton,
  SavedMealsList,
} from "./components";
export { useHomePage } from "./hooks";
export type { MacroDailyTotals, MacroEntry, MealType } from "./types";
export type {
  AddEntryPayload,
  OptimisticUpdateState,
  UpdateEntryPayload,
} from "./utils";
export {
  areEntriesSame,
  createStateSnapshot,
  formatMacroValue,
  removeEntryFromList,
  updateEntryInList,
  validateMacroInputs,
} from "./utils";
