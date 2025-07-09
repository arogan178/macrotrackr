import { memo } from "react";
import { NUMBER_FIELD_ALLOWED_KEYS } from "@/utils/constants";
import type { NumberFieldProps } from "@/components/utils/types"; // Assuming NumberFieldProps is defined here
import { formStyles } from "@/components/utils/styles";

// Update NumberFieldProps in ../utils/types.ts if needed to include 'disabled'
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent changes if disabled
    if (disabled) return;

    const val = e.target.value;

    // Handle empty input properly
    if (val === "") {
      onChange(undefined);
      return;
    }

    // Check if it's a valid number pattern
    if (/^-?\d*\.?\d*$/.test(val)) {
      if (maxDigits && val.replace(/[^0-9]/g, "").length > maxDigits) {
        return;
      }

      onChange(Number(val));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent keydown if disabled
    if (disabled) {
      e.preventDefault();
      return;
    }

    // Always allow Backspace, Delete, and navigation keys
    if (
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      return;
    }

    // Allow digits
    if (/\d/.test(e.key)) {
      return;
    }

    if (!NUMBER_FIELD_ALLOWED_KEYS.includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === "." && e.currentTarget.value.includes(".")) {
      e.preventDefault();
    }

    if (e.key === "-" && e.currentTarget.value !== "") {
      e.preventDefault();
    }
  };

  // Add disabled styles
  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${formStyles.input.numberInput} ${unit ? formStyles.input.withUnit : ""} ${
    disabled ? formStyles.input.disabled : "" // Add disabled class
  }`;

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
          value={value === 0 ? "0" : value ?? ""} // Use nullish coalescing for undefined/null
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          required={required}
          placeholder={placeholder?.toString() ?? ""} // Handle potential null/undefined placeholder
          disabled={disabled} // Pass disabled prop to the input element
          aria-describedby={helperText ? `${label}-helper` : undefined} // Add aria-describedby
        />
        {unit && <div className={formStyles.unitContainer}>{unit}</div>}
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
