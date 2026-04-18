import { memo } from "react";

import { formStyles } from "@/components/form/FormStyles";
import type { TimeFieldProps } from "@/components/form/FormTypes";

import { cn } from "../../lib/classnameUtilities";

function TimeField({
  label,
  value,
  onChange,
  required = false,
  error,
  helperText,
  disabled = false,
  id,
  name,
  step,
}: TimeFieldProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const inputClasses = cn(
    formStyles.input.base,
    error ? formStyles.input.error : formStyles.input.normal,
    disabled && formStyles.input.disabled,
    "cursor-pointer"
  );

  const resolvedId = id ?? name ?? label;

  return (
    <div className={formStyles.container}>
      {label ? (
        <label className={formStyles.label} htmlFor={resolvedId}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={resolvedId}
          name={name}
          type="time"
          value={value}
          onChange={handleChange}
          className={inputClasses}
          required={required}
          disabled={disabled}
          step={step}
          aria-describedby={helperText ? `${resolvedId}-helper` : undefined}
        />
      </div>
      {helperText && !error && (
        <p id={`${resolvedId}-helper`} className={formStyles.helper}>
          {helperText}
        </p>
      )}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(TimeField);
