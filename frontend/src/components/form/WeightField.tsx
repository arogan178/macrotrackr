import NumberField from "@/components/form/NumberField";
import {
  fromKg,
  toKg,
  type UnitSystem,
  weightLimits,
  weightUnit,
} from "@/utils/unitConversion";

interface WeightFieldProps {
  label: string;
  /** Always kg; only the input speaks the user's unit. */
  value: number | undefined;
  onChange: (kg: number | undefined) => void;
  unitSystem: UnitSystem;
  minKg: number;
  maxKg: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export default function WeightField({
  value,
  onChange,
  unitSystem,
  minKg,
  maxKg,
  ...rest
}: WeightFieldProps) {
  const isImperial = unitSystem === "imperial";
  const { min, max } = weightLimits(minKg, maxKg, unitSystem);

  return (
    <NumberField
      {...rest}
      // Rounded to the 0.1 step: a lb entry is stored as 0.01 kg, which would
      // otherwise fail the step check once shown in kg.
      value={
        value === undefined
          ? undefined
          : Math.round(fromKg(value, unitSystem) * 10) / 10
      }
      onChange={(typed) =>
        onChange(typed === undefined ? undefined : toKg(typed, unitSystem))
      }
      min={min}
      max={max}
      step={0.1}
      unit={weightUnit(unitSystem)}
      // A typical lb weight, 165.5, is already four digits.
      maxDigits={isImperial ? 4 : 3}
    />
  );
}
