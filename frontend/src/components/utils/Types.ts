// ModalProps: Union type for all modal variants
import { ReactNode } from "react";

import type { BUTTON_SIZES, ICON_SIZES } from "./Constants";

export type ModalProps = ConfirmationModalProps | FormModalProps;

// Define common type aliases for better type safety
type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
export type ButtonSize = keyof typeof BUTTON_SIZES;
export type IconSize = keyof typeof ICON_SIZES;
type ButtonType = "button" | "submit" | "reset";
type IconPosition = "left" | "right";

export interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  iconSize?: IconSize;
  buttonSize?: ButtonSize;
  hideClose?: boolean; // If true, do not show the X (close) button
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export interface FormModalProps extends BaseModalProps {
  variant: "form";
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  hideDefaultButtons?: boolean;
  hideCancelButton?: boolean;
}

export interface ConfirmationModalProps extends BaseModalProps {
  variant: "confirmation";
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDanger?: boolean;
  hideCancelButton?: boolean;
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
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
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
  error?: string | undefined;
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
  options: readonly SelectOption[] | SelectOption[];
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
  layoutId?: string; // Optional layoutId for motion
  isMotion?: boolean; // Optional flag to enable motion
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
  buttonSize?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  fullWidth?: boolean;
  ariaLabel?: string;
  /**
   * Auto-detect loading state from a specific feature
   * When provided, will automatically show loading when that feature has active mutations
   */
  autoLoadingFeature?: 'auth' | 'habits' | 'goals' | 'macros' | 'settings';
  
  /**
   * Auto-detect loading state globally
   * When true, will show loading when any mutation is active
   */
  autoLoadingGlobal?: boolean;
}

export interface LoadingSpinnerProps {
  size?: IconSize;
  color?: string;
  label?: string;
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

export interface ActionButtonGroupProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  editLabel?: string;
  deleteLabel?: string;
  buttonSize?: ButtonSize;
  iconSize?: IconSize;
}
