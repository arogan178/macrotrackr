import { memo } from "react";

import { formStyles } from "@/components/form/FormStyles";
import type { DateFieldProps } from "@/components/form/FormTypes";
import { todayISO } from "@/utils/dateUtilities";

import { cn } from "../../lib/classnameUtilities";

function DateField({
  label,
  value,
  onChange,
  required = false,
  error,
  helperText,
  minDate,
  maxDate,
  disabled = false,
  id,
  name,
}: DateFieldProps) {
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
  const resolvedMaxDate = maxDate ?? todayISO();

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
          type="date"
          value={value}
          onChange={handleChange}
          className={inputClasses}
          required={required}
          min={minDate}
          max={resolvedMaxDate}
          disabled={disabled}
          aria-describedby={helperText ? `${resolvedId}-helper` : undefined}
        />
      </div>
      {helperText && !error ? (
        <p id={`${resolvedId}-helper`} className={formStyles.helper}>
          {helperText}
        </p>
      ) : null}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(DateField);
