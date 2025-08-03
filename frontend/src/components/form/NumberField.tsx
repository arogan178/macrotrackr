import { memo } from "react";

import { formStyles } from "@/components/form/Styles";
import type { NumberFieldProps } from "@/components/form/types";
import { NUMBER_FIELD_ALLOWED_KEYS } from "@/utils/constants";

// Update NumberFieldProps in ../form/types.ts if needed to include 'disabled'
// interface NumberFieldProps {
//   // ... other props
//   disabled?: boolean;
// }

function NumberField({
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
  disabled = false, // Add disabled prop with default value
  helperText, // Add helperText prop
}: NumberFieldProps) {
  // Destructure disabled
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent changes if disabled
    if (disabled) return;

    const value_ = event.target.value;

    // Handle empty input properly
    if (value_ === "") {
      onChange(undefined as unknown as number);
      return;
    }

    // Check if it's a valid number pattern
    if (/^-?\d*\.?\d*$/.test(value_)) {
      // Use replace for broader runtime compatibility instead of replaceAll
      const digitsOnlyLength = value_.replaceAll(/\D/g, "").length;
      if (maxDigits && digitsOnlyLength > maxDigits) {
        return;
      }

      onChange(Number(value_));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent keydown if disabled
    if (disabled) {
      event.preventDefault();
      return;
    }

    // Always allow Backspace, Delete, and navigation keys
    if (
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
        event.key,
      )
    ) {
      return;
    }

    // Allow digits
    if (/\d/.test(event.key)) {
      return;
    }

    if (!NUMBER_FIELD_ALLOWED_KEYS.includes(event.key)) {
      event.preventDefault();
    }

    if (event.key === "." && event.currentTarget.value.includes(".")) {
      event.preventDefault();
    }

    if (event.key === "-" && event.currentTarget.value !== "") {
      event.preventDefault();
    }
  };

  // Add disabled styles
  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${formStyles.input.numberInput} ${unit ? formStyles.input.withUnit : ""} ${
    disabled ? formStyles.input.disabled : ""
  } placeholder:text-muted`;

  return (
    <div className={formStyles.container}>
      <label htmlFor={label} className={formStyles.label}>
        {label}
      </label>{" "}
      {/* Add htmlFor */}
      <div className="relative">
        <input
          id={label} // Add id matching htmlFor
          type="number"
          value={value === 0 ? "0" : (value ?? "")} // Use undefinedish coalescing for undefined/undefined
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          required={required}
          placeholder={placeholder?.toString() ?? ""} // Handle potential undefined/undefined placeholder
          disabled={disabled} // Pass disabled prop to the input element
          aria-describedby={helperText ? `${label}-helper` : undefined} // Add aria-describedby
        />
        {unit && (
          <div className={`${formStyles.unitContainer} text-muted`}>{unit}</div>
        )}
      </div>
      {helperText && (
        <p id={`${label}-helper`} className={formStyles.helper}>
          {helperText}
        </p>
      )}{" "}
      {/* Add helper text */}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(NumberField);
