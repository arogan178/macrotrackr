/**
 * Type definitions for macro targets and distribution management
 */

/**
 * Available macro nutrient types
 */
export type MacroType = "protein" | "carbs" | "fats";

/**
 * Represents the percentage distribution of macronutrients
 */
export interface MacroPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

/**
 * Extends percentages to include locked macros state
 */
export interface MacroTargetState extends MacroPercentages {
  lockedMacros: MacroType[];
}

/**
 * Props for the MacroTarget component
 */
export interface MacroTargetProps {
  initialValues?: MacroTargetState;
  onTargetChange: (target: MacroTargetState) => void;
}

/**
 * Props for MacroSlider component
 */
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

/**
 * Props for MacroBadge component
 */
export interface MacroBadgeProps {
  name: string;
  value: number;
  color: "green" | "blue" | "red";
  isLocked: boolean;
}

/**
 * Props for MacroTargetBar component
 */
export interface MacroTargetBarProps {
  percentages: MacroPercentages;
  className?: string;
}

/**
 * Props for MacroTargetInfo component
 */
export interface MacroTargetInfoProps {
  isVisible: boolean;
}