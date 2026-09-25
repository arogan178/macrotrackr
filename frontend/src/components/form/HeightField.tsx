import NumberField from "@/components/form/NumberField";
import { cmToFtIn, ftInToCm, type UnitSystem } from "@/utils/unitConversion";

interface HeightFieldProps {
  label: string;
  /** Always cm; only the input speaks the user's unit. */
  value: number | undefined;
  onChange: (cm: number | undefined) => void;
  unitSystem: UnitSystem;
  min: number;
  max: number;
  required?: boolean;
  error?: string;
}

export default function HeightField({
  label,
  value,
  onChange,
  unitSystem,
  min,
  max,
  required,
  error,
}: HeightFieldProps) {
  if (unitSystem === "metric") {
    return (
      <NumberField
        label={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={1}
        unit="cm"
        required={required}
        error={error}
      />
    );
  }

  const { feet, inches } = cmToFtIn(value ?? 0);
  const hasValue = value !== undefined;
  // Whole inches survive the trip through whole cm, so the pair never drifts.
  const update = (nextFeet: number, nextInches: number) =>
    onChange(ftInToCm(nextFeet, nextInches) || undefined);

  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberField
        label={label}
        value={hasValue ? feet : undefined}
        onChange={(typed) => update(typed ?? 0, inches)}
        min={3}
        max={8}
        step={1}
        maxDigits={1}
        unit="ft"
        required={required}
        error={error}
      />
      <NumberField
        label="Inches"
        value={hasValue ? inches : undefined}
        onChange={(typed) => update(feet, typed ?? 0)}
        min={0}
        max={11}
        step={1}
        maxDigits={2}
        unit="in"
      />
    </div>
  );
}
