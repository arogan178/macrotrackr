import { memo } from "react";
import { NUMBER_FIELD_ALLOWED_KEYS } from "@/utils/constants";
import { NumberFieldProps } from "../utils/types";
import { formStyles } from "../utils/styles";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  required = false,
  unit,
  error,
  maxDigits = 3,
  placeholder = 0,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
      if (maxDigits && val.replace(/[^0-9]/g, "").length > maxDigits) {
        return;
      }

      onChange(val === "" ? undefined : Number(val));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/\d/.test(e.key)) {
      return;
    }

    if (!NUMBER_FIELD_ALLOWED_KEYS.includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === "." && e.currentTarget.value.includes(".")) {
      e.preventDefault();
    }

    if (e.key === "-" && e.currentTarget.value !== "") {
      e.preventDefault();
    }
  };

  const inputClasses = `${formStyles.input.base} ${
    error ? formStyles.input.error : formStyles.input.normal
  } ${formStyles.input.numberInput} ${unit ? formStyles.input.withUnit : ""}`;

  return (
    <div className={formStyles.container}>
      <label className={formStyles.label}>{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value === 0 ? "0" : value || ""}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          required={required}
          placeholder={placeholder.toString()}
        />
        {unit && <div className={formStyles.unitContainer}>{unit}</div>}
      </div>
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
}

export default memo(NumberField);
