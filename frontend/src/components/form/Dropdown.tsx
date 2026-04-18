import { memo } from "react";

import { formStyles } from "@/components/form/FormStyles";
import type { DropdownProps } from "@/components/form/FormTypes";

import { cn } from "../../lib/classnameUtilities";

function Dropdown({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  helperText,
  placeholder,
  id,
  name,
}: DropdownProps) {
  const selectClasses = cn(
    formStyles.input.base,
    error ? formStyles.input.error : formStyles.input.normal,
    formStyles.select.base,
    disabled ? formStyles.input.disabled : "cursor-pointer"
  );

  const resolvedId = id ?? name ?? label;
  const normalizedValue = value ?? "";
  const normalizedOptions =
    placeholder && !options.some((option) => option.value === "")
      ? [{ value: "", label: placeholder }, ...options]
      : options;

  return (
    <div className={formStyles.container}>
      {label ? (
        <label className={formStyles.label} htmlFor={resolvedId}>
          {label}
        </label>
      ) : null}
      <div className={formStyles.select.container}>
        <select
          id={resolvedId}
          name={name}
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
          className={selectClasses}
          required={required}
          disabled={disabled}
          aria-describedby={helperText ? `${resolvedId}-helper` : undefined}
        >
          {normalizedOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.value === ""}
              hidden={option.value === ""}
              className="cursor-pointer"
            >
              {option.label}
            </option>
          ))}
        </select>
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

export default memo(Dropdown);
