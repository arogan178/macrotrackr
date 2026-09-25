import { useState } from "react";

import type { ActivityLevel, Gender } from "@/types/activity";
import type { UnitSystem } from "@/utils/unitConversion";

import { hasValidBodyStats } from "./calculatorInputs";
import { useSharedInputs } from "./sharedInputs";

const UNIT_SYSTEMS = ["metric", "imperial"] as const satisfies readonly UnitSystem[];
const SEXES = ["male", "female"] as const satisfies readonly Gender[];
const ACTIVITY_LEVELS = [
  "sedentary",
  "low",
  "medium",
  "high",
  "athlete",
] as const satisfies readonly ActivityLevel[];

/** A decimal place is plenty for a link, and hides lb and ft conversion noise. */
const toTenths = (value: number) => Math.round(value * 10) / 10;

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

  // Same bounds as the form fields, in the metric units the state is kept in.
  useSharedInputs((read) => {
    const units = read.oneOf("units", UNIT_SYSTEMS);
    const sex = read.oneOf("sex", SEXES);
    const sharedAge = read.number("age", 1, 120);
    const weight = read.number("weight", 15, 500);
    const height = read.number("height", 50, 250);
    const activity = read.oneOf("activity", ACTIVITY_LEVELS);

    if (units) setUnitSystem(units);
    if (sex) setGender(sex);
    if (sharedAge !== undefined) setAge(sharedAge);
    if (weight !== undefined) setWeightKg(weight);
    if (height !== undefined) setHeightCm(height);
    if (activity) setActivityLevel(activity);
  });

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
    /** These inputs as query parameters, for a shared result link. */
    shareInputs: {
      units: unitSystem,
      sex: gender,
      age,
      weight: toTenths(weightKg),
      height: toTenths(heightCm),
      activity: activityLevel,
    },
  };
}

export type BodyStatsControls = ReturnType<typeof useBodyStats>;
