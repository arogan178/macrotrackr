/**
 * Re-export shared user constants for backwards compatibility
 * Import from @/utils/userConstants for new code
 */
export {
  ACTIVITY_LEVELS,
  type ActivityLevel,
  GENDER_OPTIONS,
  getActivityLevelFromString,
  getActivityLevelLabel,
  getActivityLevelMultiplier,
  getActivityLevelValue,
} from "@/utils/userConstants";
