import { memo } from "react";

import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import { formStyles } from "@/components/form/Styles";
import type { UnitType } from "@/features/macroTracking/utils/units";

export interface QuantityUnitFieldProps {
  label: string;
  quantity: number | undefined;
  unit: UnitType;
  onQuantityChange: (value: number | undefined) => void;
  onUnitChange: (value: UnitType) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

const QuantityUnitField = memo(function QuantityUnitField({
  label,
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  disabled = false,
  placeholder = "100",
  required = false,
  error,
  helperText,
}: QuantityUnitFieldProps) {
  const unitOptions = [
    { value: "g", label: "g" },
    { value: "kg", label: "kg" },
    { value: "oz", label: "oz" },
    { value: "lb", label: "lb" },
    { value: "ml", label: "ml" },
    { value: "L", label: "L" },
    { value: "cup", label: "cup" },
    { value: "tbsp", label: "tbsp" },
    { value: "tsp", label: "tsp" },
    { value: "pt", label: "pt" },
    { value: "unit", label: "pcs" },
  ];

  const handleQuantityChange = (value: number | undefined) => {
    onQuantityChange(value);
  };

  const handleUnitChange = (value: string) => {
    onUnitChange(value as UnitType);
  };

  return (
    <div>
      <label className={formStyles.label}>
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex space-x-2">
        <div className="flex-1">
          <NumberField
            value={quantity}
            onChange={handleQuantityChange}
            min={0}
            step={0.01}
            maxDigits={6}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
          />
        </div>
        <div className="w-20">
          <Dropdown
            value={unit}
            onChange={handleUnitChange}
            options={unitOptions}
            disabled={disabled}
            required={required}
          />
        </div>
      </div>
      {helperText && <p className={formStyles.helper}>{helperText}</p>}
      {error && <p className={formStyles.error}>{error}</p>}
    </div>
  );
});

export default QuantityUnitField;
