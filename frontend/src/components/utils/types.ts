import { ReactNode } from "react";

// Define common type aliases for better type safety
type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";
type ButtonType = "button" | "submit" | "reset";
type IconPosition = "left" | "right";

export interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  textOnly?: boolean;
  icon?: ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export interface DateFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}

export interface NumberFieldProps {
  label: string;
  value: number | undefined | string; // Allow string for intermediate input state
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  unit?: string;
  error?: string | null;
  maxDigits?: number;
  placeholder?: number | string; // Allow string placeholder
  disabled?: boolean; // Add disabled prop
  helperText?: string; // Add helperText prop
}

export interface TimeFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface DropdownProps extends BaseFieldProps {
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
}

export interface InfoCardProps {
  title: string;
  description?: string;
  color?: "green" | "blue" | "red" | "indigo" | "purple";
  icon?: ReactNode;
  children?: ReactNode;
}

export interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export interface CardContainerProps {
  children: ReactNode;
  className?: string;
}

export interface FormButtonProps {
  children?: ReactNode;
  text?: string;
  type?: ButtonType;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  ariaLabel?: string;
}

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
}

export interface SaveButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

// Chart data point - used for all chart visualizations
export interface ChartDataPoint {
  name: string; // x-axis label (e.g., date)
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  [key: string]: number | string; // Allow additional properties for flexibility
}

// Line configuration for charts
export interface LineConfig {
  dataKey: string;
  name?: string; // Optional: Name for legend and tooltip
  color?: string; // Optional: HSL or RGB color string
  strokeWidth?: number;
  dot?: React.ReactElement | object | boolean;
  activeDot?: React.ReactElement | object | boolean;
  type?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter";
  connectNulls?: boolean;
}

// Nutrition averages for summary statistics
export interface NutritionAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}
