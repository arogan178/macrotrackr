import { ReactNode } from "react";

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

export interface NumberFieldProps extends BaseFieldProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: number;
  maxDigits?: number;
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
  isLoading: boolean;
  loadingText?: string;
  text: string | ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  icon?: ReactNode;
  className?: string;
}
