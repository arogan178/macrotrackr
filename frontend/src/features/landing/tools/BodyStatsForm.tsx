import { useId } from "react";

import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import type { ActivityLevel, Gender } from "@/types/activity";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/utils/unitConversion";
import { ACTIVITY_LEVELS, GENDER_OPTIONS } from "@/utils/userConstants";

import { toNumericInput } from "./calculatorInputs";
import type { BodyStatsControls } from "./useBodyStats";

interface BodyStatsFormProps {
  stats: BodyStatsControls;
  showActivity?: boolean;
}

const activityOptions = Object.values(ACTIVITY_LEVELS).map((item) => ({
  value: item.value,
  label: `${item.label} (x${item.multiplier})`,
}));

// The shared constant leads with a "Select gender" placeholder; the
// calculators always start from a real value, so it is filtered out here.
const genderDropdownOptions = GENDER_OPTIONS.filter(
  (item) => item.value !== "",
).map((item) => ({
  value: item.value,
  label: item.label,
}));

export default function BodyStatsForm({
  stats,
  showActivity = false,
}: BodyStatsFormProps) {
  const {
    weightKg,
    setWeightKg,
    heightCm,
    setHeightCm,
    age,
    setAge,
    gender,
    setGender,
    activityLevel,
    setActivityLevel,
    unitSystem,
    setUnitSystem,
  } = stats;
  const { feet, inches } = cmToFtIn(heightCm);
  const weightLb = kgToLb(weightKg);
  const unitSystemLabelId = useId();

  return (
    <div className="space-y-4">
      {/* Unit System Toggle */}
      <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface-2 p-2 text-xs">
        <span id={unitSystemLabelId} className="pl-1 font-medium text-muted">
          Units
        </span>
        <div
          role="group"
          aria-labelledby={unitSystemLabelId}
          className="flex items-center gap-1 rounded-control bg-surface p-1"
        >
          <button
            type="button"
            onClick={() => setUnitSystem("imperial")}
            aria-pressed={unitSystem === "imperial"}
            className={`min-h-8 cursor-pointer rounded-control px-2.5 py-1 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none ${
              unitSystem === "imperial"
                ? "bg-primary font-semibold text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            Imperial<span className="hidden sm:inline"> (lb, ft)</span>
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem("metric")}
            aria-pressed={unitSystem === "metric"}
            className={`min-h-8 cursor-pointer rounded-control px-2.5 py-1 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none ${
              unitSystem === "metric"
                ? "bg-primary font-semibold text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            Metric<span className="hidden sm:inline"> (kg, cm)</span>
          </button>
        </div>
      </div>

      {/* Two up even on phones: the whole form stays above the fold. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Dropdown
          label="Gender"
          value={gender}
          onChange={(v) => setGender(v as Gender)}
          options={genderDropdownOptions}
        />

        <NumberField
          label="Age"
          value={age || ""}
          onChange={(v) => setAge(toNumericInput(v, 120))}
          min={1}
          max={120}
          unit="years"
        />

        {unitSystem === "imperial" ? (
          <NumberField
            label="Weight"
            value={weightLb || ""}
            onChange={(v) => setWeightKg(lbToKg(toNumericInput(v, 1000)))}
            min={30}
            max={1000}
            unit="lbs"
          />
        ) : (
          <NumberField
            label="Weight"
            value={weightKg || ""}
            onChange={(v) => setWeightKg(toNumericInput(v, 500))}
            min={15}
            max={500}
            unit="kg"
          />
        )}

        {unitSystem === "imperial" ? (
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1">
            <NumberField
              label="Height (ft)"
              value={feet || ""}
              onChange={(v) =>
                setHeightCm(ftInToCm(toNumericInput(v, 8), inches))
              }
              min={1}
              max={8}
              unit="ft"
            />
            <NumberField
              label="Height (in)"
              value={inches || ""}
              onChange={(v) =>
                setHeightCm(ftInToCm(feet, toNumericInput(v, 11)))
              }
              min={0}
              max={11}
              unit="in"
            />
          </div>
        ) : (
          <NumberField
            label="Height"
            value={heightCm || ""}
            onChange={(v) => setHeightCm(toNumericInput(v, 250))}
            min={50}
            max={250}
            unit="cm"
          />
        )}
      </div>

      {showActivity ? (
        <Dropdown
          label="Activity Level"
          value={activityLevel}
          onChange={(v) => setActivityLevel(v as ActivityLevel)}
          options={activityOptions}
        />
      ) : null}
    </div>
  );
}
