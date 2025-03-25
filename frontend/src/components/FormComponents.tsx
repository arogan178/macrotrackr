import React, { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { EyeIcon, EyeSlashIcon } from "./Icons";
import {
  TEXT_FIELD_DEFAULT_MIN_LENGTH,
  TEXT_FIELD_DEFAULT_MAX_LENGTH,
  NUMBER_FIELD_ALLOWED_KEYS,
} from "../utils/constants";

/* Text Input Field Component */
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "password";
  error?: string;
  helperText?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  textOnly?: boolean;
  icon?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  error,
  helperText,
  placeholder = "",
  minLength = TEXT_FIELD_DEFAULT_MIN_LENGTH,
  maxLength = TEXT_FIELD_DEFAULT_MAX_LENGTH,
  textOnly = false,
  icon,
  onKeyDown,
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // If textOnly is true, filter out non-alphabetic characters
    if (textOnly && newValue !== "") {
      const textOnlyValue = newValue.replace(/[^a-zA-Z\s]/g, "");
      onChange(textOnlyValue);
    } else {
      onChange(newValue);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShow) => !prevShow);
  };

  // Determine actual input type based on password visibility state
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          className={`w-full px-4 py-2 bg-gray-700/70 border-2 ${
            error ? "border-red-500/70" : "border-gray-600/70"
          } rounded-lg text-gray-100 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                  transition-all duration-200 shadow-sm
                  placeholder:text-gray-500 ${
                    type === "password" ? "pr-10" : ""
                  } ${icon ? "pl-10" : ""}`}
          required={required}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none ${
              !value ? "opacity-0" : ""
            }`}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={!value}
          >
            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {maxLength && value.length === maxLength && !error && (
        <p className="text-xs text-gray-500">
          {`Maximum ${maxLength} characters reached`}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* Date Input Field Component */
interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  minDate?: string;
  maxDate?: string;
}

export function DateField({
  label,
  value,
  onChange,
  required = false,
  error,
}: DateFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700/70 border-2 ${
            error ? "border-red-500/70" : "border-gray-600/70"
          } rounded-lg text-gray-100 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                  transition-all duration-200 shadow-sm`}
          required={required}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* Number Input Field Component */
interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  unit?: string;
  error?: string;
  placeholder?: number;
  maxDigits?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  required = false,
  unit,
  error,
  maxDigits = 3,
  placeholder = 0,
}: NumberFieldProps & { maxDigits?: number }) {
  // Handle input validation for numbers only
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Only allow valid numeric patterns
    if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
      // Check max digits constraint
      if (maxDigits && val.replace(/[^0-9]/g, "").length > maxDigits) {
        return;
      }

      // Convert to number or undefined if empty
      onChange(val === "" ? undefined : Number(val));
    }
  };

  // Handle keydown to prevent invalid characters
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow number keys
    if (/\d/.test(e.key)) {
      return;
    }

    // Block input if not a number and not in allowedKeys
    if (!NUMBER_FIELD_ALLOWED_KEYS.includes(e.key)) {
      e.preventDefault();
    }

    // Only allow one decimal point
    if (e.key === "." && e.currentTarget.value.includes(".")) {
      e.preventDefault();
    }

    // Only allow minus at the beginning
    if (e.key === "-" && e.currentTarget.value !== "") {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value === 0 ? "0" : value || ""}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          className={`w-full px-4 py-2 bg-gray-700/70 border-2 ${
            error ? "border-red-500/70" : "border-gray-600/70"
          } rounded-lg text-gray-100 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                  transition-all duration-200 shadow-sm pl-4 ${
                    unit ? "pr-10" : "pr-4"
                  }
                  [&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                  [-moz-appearance:textfield]`}
          required={required}
          placeholder={placeholder.toString()}
        />
        {unit && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {unit}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

/* Time Input Field Component */
interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export function TimeField({
  label,
  value,
  onChange,
  required = false,
  error,
  helperText,
}: TimeFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={handleChange}
          className={`w-full px-4 py-2 bg-gray-700/70 border-2 ${
            error ? "border-red-500/70" : "border-gray-600/70"
          } rounded-lg text-gray-100 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                  transition-all duration-200 shadow-sm`}
          required={required}
        />
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* Select Field Component */
interface SelectOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function Dropdown({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
}: DropdownProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 bg-gray-700/70 border-2 ${
          error ? "border-red-500/70" : "border-gray-600/70"
        } rounded-lg text-gray-100 
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                transition-all duration-200 shadow-sm appearance-none
                bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat`}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

/* Info Card Component */
interface InfoCardProps {
  title: string;
  description?: string;
  color?: "green" | "blue" | "red" | "indigo" | "purple";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function InfoCard({
  title,
  description,
  color = "indigo",
  icon,
  children,
}: InfoCardProps) {
  const colorMap = {
    green: {
      bg: "from-green-900/30 to-gray-800/10",
      border: "border-green-500/20",
      text: "text-green-400",
      dot: "bg-green-500",
    },
    blue: {
      bg: "from-blue-900/30 to-gray-800/10",
      border: "border-blue-500/20",
      text: "text-blue-400",
      dot: "bg-blue-500",
    },
    red: {
      bg: "from-red-900/30 to-gray-800/10",
      border: "border-red-500/20",
      text: "text-red-400",
      dot: "bg-red-500",
    },
    indigo: {
      bg: "from-indigo-900/30 to-gray-800/10",
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      dot: "bg-indigo-500",
    },
    purple: {
      bg: "from-purple-900/30 to-gray-800/10",
      border: "border-purple-500/20",
      text: "text-purple-400",
      dot: "bg-purple-500",
    },
  };

  const { bg, border, text, dot } = colorMap[color];

  return (
    <div className={`bg-gradient-to-br ${bg} p-4 rounded-xl border ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        {!icon && <div className={`w-2 h-2 rounded-full ${dot}`}></div>}
        {icon && <div className={text}>{icon}</div>}
        <h4 className={`${text} font-medium`}>{title}</h4>
      </div>
      {description && <p className="text-sm text-gray-400">{description}</p>}
      {children}
    </div>
  );
}

/* Tab Button Component */
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-6 font-medium text-sm focus:outline-none ${
        active
          ? "text-indigo-400 border-b-2 border-indigo-500"
          : "text-gray-400 hover:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

/* Card Container Component */
interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContainer({
  children,
  className = "",
}: CardContainerProps) {
  return (
    <div
      className={`bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

/* Form Button Component */
interface FormButtonProps {
  isLoading: boolean;
  loadingText?: string;
  text: string | React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
  className?: string;
}

export function FormButton({
  isLoading,
  loadingText = "Processing...",
  text,
  onClick,
  type = "button",
  variant = "primary",
  icon,
  className = "",
}: FormButtonProps) {
  const baseClasses =
    "py-3 rounded-lg font-medium flex items-center justify-center";
  const primaryClasses = `${baseClasses} text-white bg-gradient-to-r from-indigo-600 to-blue-500 
                          hover:from-indigo-500 hover:to-blue-400 shadow-lg shadow-indigo-500/30`;
  const secondaryClasses = `${baseClasses} border border-gray-600/50 text-gray-300 hover:bg-gray-700/50`;

  const buttonClasses =
    variant === "primary" ? primaryClasses : secondaryClasses;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`${buttonClasses} disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner />
          {loadingText}
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {icon}
          {text}
        </span>
      )}
    </button>
  );
}
