import { useState } from "react";

import type { ActivityLevel, Gender } from "@/types/activity";
import type { UnitSystem } from "@/utils/unitConversion";

import { hasValidBodyStats } from "./calculatorInputs";

/**
 * Every calculator starts from the same body stats, so they all share this
 * state and hand the whole bundle straight to <BodyStatsForm />.
 */
export function useBodyStats(initialWeightKg = 75) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState(28);
  const [weightKg, setWeightKg] = useState(initialWeightKg);
  const [heightCm, setHeightCm] = useState(175);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("medium");

  return {
    unitSystem,
    setUnitSystem,
    gender,
    setGender,
    age,
    setAge,
    weightKg,
    setWeightKg,
    heightCm,
    setHeightCm,
    activityLevel,
    setActivityLevel,
    /** True once age, weight, and height all have usable values. */
    ready: hasValidBodyStats({ weightKg, heightCm, age }),
  };
}

export type BodyStatsControls = ReturnType<typeof useBodyStats>;
