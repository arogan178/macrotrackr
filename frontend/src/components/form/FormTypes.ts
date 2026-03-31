import type { ReactNode } from "react";

export interface BaseFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
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
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}

export interface DateFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}

export interface NumberFieldProps extends BaseFieldProps {
  value: number | undefined | string;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  maxDigits?: number;
  placeholder?: number | string;
}

export interface TimeFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface DropdownProps extends BaseFieldProps {
  label?: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: readonly SelectOption[] | SelectOption[];
  placeholder?: string;
}

export interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  /** Visual style variant for the card */
  variant?: "default" | "transparent" | "interactive";
}

export interface InfoCardProps {
  title: string;
  description?: string;
  color?: "green" | "blue" | "red" | "indigo" | "purple" | "accent" | "protein" | "carbs" | "fats" | "vibrant-accent";
  icon?: ReactNode;
  children?: ReactNode;
}
