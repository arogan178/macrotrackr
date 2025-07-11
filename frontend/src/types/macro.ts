// Utility type for macro percentage keys
export type MacroType = "protein" | "carbs" | "fats";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MacroTargetGrams = {
  protein: number;
  carbs: number;
  fats: number;
};

export interface MacroTargetSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  lockedMacros?: MacroType[];
}

export interface MacroPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

export interface MacroTargetState extends MacroPercentages {
  lockedMacros: MacroType[];
}

// MacroTarget interface for use in goals and other features
export interface MacroTarget {
  macroTarget?: MacroTargetSettings;
}
export interface MacroEntry {
  id: number;
  createdAt: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
  entryDate: string;
  entryTime: string;
  foodName?: string;
}

export interface MacroDailyTotals {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
}

export interface MacroSliderProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  color: "green" | "blue" | "red";
  isLocked: boolean;
  onToggleLock: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export interface MacroBadgeProps {
  name: string;
  value: number;
  color: "green" | "blue" | "red";
  isLocked: boolean;
}

export interface MacroTargetBarProps {
  percentages: MacroPercentages;
  className?: string;
}

export interface MacroTargetInfoProps {
  isVisible: boolean;
}
