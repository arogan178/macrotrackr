import { DropdownProps } from "../utils/types";
import { formStyles } from "../utils/styles";

export function Dropdown({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
}: DropdownProps) {
  const selectClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${formStyles.select.base}`;

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label}>{label}</label>
      <div className={formStyles.select.container}>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={selectClasses}
          required={required}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}
