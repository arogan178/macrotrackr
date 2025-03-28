import React from "react";
import { DateFieldProps } from "../utils/types";
import { formStyles } from "../utils/styles";

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

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  }`;

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label}>{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleChange}
          className={inputClasses}
          required={required}
        />
      </div>
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}
