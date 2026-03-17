import { memo, useId } from "react";

import { formStyles } from "@/components/form/Styles";
import type { NumberFieldProps } from "@/components/form/Types";
import { NUMBER_FIELD_ALLOWED_KEYS } from "@/utils/constants";

import { cn } from "../../lib/classnameUtilities";

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
  disabled = false,
  helperText,
  id,
  name,
}: NumberFieldProps) {
  const autoId = useId();
  const inputId = id ?? name ?? (label ? `number-field-${label}` : `number-field-${autoId}`);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const value_ = event.target.value;

    if (value_ === "") {
      onChange(undefined);

      return;
    }

    if (/^-?\d*\.?\d*$/.test(value_)) {
      const digitsOnlyLength = value_.replaceAll(/\D/g, "").length;
      if (maxDigits && digitsOnlyLength > maxDigits) {
        return;
      }

      onChange(Number(value_));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      event.preventDefault();

      return;
    }

    if (
      ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
        event.key,
      )
    ) {
      return;
    }

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

  const inputClasses = cn(
    formStyles.input.base,
    error ? formStyles.input.error : formStyles.input.normal,
    formStyles.input.numberInput,
    unit && formStyles.input.withUnit,
    disabled && formStyles.input.disabled,
    "placeholder:text-muted"
  );

  return (
    <div className={formStyles.container}>
      {label ? (
        <label htmlFor={inputId} className={formStyles.label}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="number"
          value={value === 0 ? "0" : (value ?? "")}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          required={required}
          placeholder={placeholder.toString()}
          disabled={disabled}
          aria-describedby={helperText ? `${inputId}-helper` : undefined}
        />
        {unit && (
          <div className={`${formStyles.unitContainer} text-muted`}>{unit}</div>
        )}
      </div>
      {helperText && (
        <p id={`${inputId}-helper`} className={formStyles.helper}>
          {helperText}
        </p>
      )}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(NumberField);
