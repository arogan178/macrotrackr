import { memo } from "react";

import { formStyles } from "@/components/form/styles";
import type { TimeFieldProps } from "@/components/utils/Types";

function TimeField({
  label,
  value,
  onChange,
  required = false,
  error,
  helperText,
}: TimeFieldProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } cursor-pointer`;

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

export default memo(TimeField);
