import type { ReactNode } from "react";

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
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  name?: string;
  autoComplete?: string;
}

export interface DateFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
}

export interface NumberFieldProps {
  label: string;
  value: number | undefined | string;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  unit?: string;
  error?: string | undefined;
  maxDigits?: number;
  placeholder?: number | string;
  disabled?: boolean;
  helperText?: string;
}

export interface TimeFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface DropdownProps {
  label?: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: readonly SelectOption[] | SelectOption[];
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
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
