import { memo } from "react";
import type { DateFieldProps } from "@/components/utils/types";
import { formStyles } from "@/components/utils/styles";

function getTodayISO() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function DateField({
  label,
  value,
  onChange,
  required = false,
  error,
  max,
  ...rest
}: DateFieldProps & { max?: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } cursor-pointer`;

  // Default max to today if not provided
  const maxDate = max || getTodayISO();

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
          max={maxDate}
          {...rest}
        />
      </div>
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(DateField);
