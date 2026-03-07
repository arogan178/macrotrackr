// Types for Macro Tracking feature
// File: [frontend/src/features/macroTracking/types/macro.ts](frontend/src/features/macroTracking/types/macro.ts:1)

import type { Ingredient } from "@/types/macro";

/**
 * Meal types supported by the app.
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Input shape expected when creating a macro entry.
 * Mirrors the onSubmit payload used by [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:86).
 */
export type MacroEntryInput = {
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
  entryDate: string; // YYYY-MM-DD
  entryTime: string; // HH:mm
  ingredients?: Ingredient[];
};

/**
 * Shape of an entry being edited via the store.editingEntry in
 * [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:69).
 */
export type EditingEntry = {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
  entryDate?: string; // optional
  entryTime?: string; // optional
  ingredients?: Ingredient[];
};

/**
 * Minimal user shape used by HomePage, returned from useUser().
 * See usage in [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:35).
 */
export type UserPublic = {
  id: number;
  firstName?: string;
};