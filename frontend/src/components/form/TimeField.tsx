import React from "react";
import { TimeFieldProps } from "./types";
import { formStyles } from "./styles";

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

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  }`;

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label}>{label}</label>
      <div className="relative">
        <input
          type="time"
          value={value}
          onChange={handleChange}
          className={inputClasses}
          required={required}
        />
      </div>
      {helperText && !error && (
        <p className={formStyles.helper}>{helperText}</p>
      )}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}
