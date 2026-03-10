import type { Ingredient } from "@/types/macro";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

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
