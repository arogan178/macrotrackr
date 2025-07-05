export interface MacroPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

export interface MacroTargetState extends MacroPercentages {
  lockedMacros: MacroType[];
}

export type MacroType = "protein" | "carbs" | "fats";

export interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
}
