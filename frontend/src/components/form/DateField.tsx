import { memo } from "react";

import { formStyles } from "@/components/form/Styles";
import type { DateFieldProps } from "@/components/form/Types";
import { todayISO } from "@/utils/dateUtilities";

import { cn } from "../../lib/classnameUtilities";

function DateField({
  label,
  value,
  onChange,
  required = false,
  error,
  max,
  ...rest
}: DateFieldProps & { max?: string }) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const inputClasses = cn(
    formStyles.input.base,
    error ? formStyles.input.error : formStyles.input.normal,
    "cursor-pointer"
  );

  // Default max to today if not provided
  const maxDate = max || todayISO();

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
