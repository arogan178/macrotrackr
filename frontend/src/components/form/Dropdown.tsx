import { memo } from "react";

import { formStyles } from "@/components/form/Styles";
import type { DropdownProps } from "@/components/form/Types";

function Dropdown({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
}: DropdownProps) {
  const selectClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${formStyles.select.base} ${disabled ? formStyles.input.disabled : "cursor-pointer"}`;

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label}>{label}</label>
      <div className={formStyles.select.container}>
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className={selectClasses}
          required={required}
          disabled={disabled}
        >
          {options.map((option) => (
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

      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(Dropdown);
