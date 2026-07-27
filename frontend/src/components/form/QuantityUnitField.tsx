import { memo } from "react";

import Dropdown from "@/components/form/Dropdown";
import { formStyles } from "@/components/form/FormStyles";
import NumberField from "@/components/form/NumberField";
import {
  UnitConverter,
  type UnitType,
} from "@/features/macroTracking/utils/units";

export interface QuantityUnitFieldProps {
  label: string;
  quantity: number | undefined;
  unit: UnitType;
  onQuantityChange: (value: number | undefined) => void;
  onUnitChange: (value: UnitType) => void;
  onQuantityUnitChange?: (
    quantity: number | undefined,
    unit: UnitType,
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

const getGramsEquivalent = (
  quantity: number | undefined,
  unit: string | undefined,
): number => {
  if (!quantity || quantity <= 0) return 0;
  const unitString = unit ?? "g";

  if (
    unitString === "unit" ||
    unitString === "pcs" ||
    unitString === "pc" ||
    unitString === "piece" ||
    unitString === "pieces"
  ) {
    return quantity * 100;
  }

  if (UnitConverter.isWeightUnit(unitString as UnitType)) {
    return UnitConverter.convert(quantity, unitString as UnitType, "g");
  }

  if (UnitConverter.isVolumeUnit(unitString as UnitType)) {
    return UnitConverter.convert(quantity, unitString as UnitType, "ml");
  }

  return quantity * 100;
};

const convertQuantity = (
  currentQty: number,
  fromUnit: UnitType,
  toUnit: UnitType,
): number => {
  if (fromUnit === toUnit) return currentQty;

  const fromGrams = getGramsEquivalent(currentQty, fromUnit);
  const isToPcs =
    toUnit === "unit" ||
    (toUnit as string) === "pcs" ||
    (toUnit as string) === "pc" ||
    (toUnit as string) === "piece" ||
    (toUnit as string) === "pieces";

  if (isToPcs) {
    return Number((fromGrams / 100).toFixed(3));
  }

  if (UnitConverter.isWeightUnit(toUnit)) {
    return Number(UnitConverter.convert(fromGrams, "g", toUnit).toFixed(3));
  }

  if (UnitConverter.isVolumeUnit(toUnit)) {
    return Number(UnitConverter.convert(fromGrams, "ml", toUnit).toFixed(3));
  }

  return Number((fromGrams / 100).toFixed(3));
};

const QuantityUnitField = memo(function QuantityUnitField({
  label,
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  onQuantityUnitChange,
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
    if (onQuantityUnitChange) {
      onQuantityUnitChange(value, unit);
    } else {
      onQuantityChange(value);
    }
  };

  const handleUnitChange = (value: string | number) => {
    const newUnit = value as UnitType;

    if (quantity && quantity > 0) {
      const convertedQuantity = convertQuantity(quantity, unit, newUnit);
      if (onQuantityUnitChange) {
        onQuantityUnitChange(convertedQuantity, newUnit);

        return;
      }

      onQuantityChange(convertedQuantity);
    }

    onUnitChange(newUnit);
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
