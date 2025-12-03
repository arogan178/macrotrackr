/**
 * Re-export shared user constants for backwards compatibility
 * Import from @/utils/userConstants for new code
 */
export {
  ACTIVITY_LEVELS,
  GENDER_OPTIONS,
  getActivityLevelLabel,
  getActivityLevelValue,
  getActivityLevelMultiplier,
  getActivityLevelFromString,
  type ActivityLevel,
} from "@/utils/userConstants";
