import { memo } from "react";
import { DateFieldProps } from "@/components/utils/types";
import { formStyles } from "@/components/utils/styles";

function DateField({
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
  } cursor-pointer`;

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

export default memo(DateField);
