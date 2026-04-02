/**
 * Settings feature public API.
 */

export * from "./components";
export { default as FreeBillingView } from "./components/FreeBillingView";
export { default as ProBillingView } from "./components/ProBillingView";

export { default as SettingsPage } from "./pages/SettingsPage";

export type {
  ActivityLevel,
  Gender,
  UserNutritionalProfile,
  UserSettings,
} from "./types/types";

export {
  calculateAge,
  calculateBMR,
  calculateMacros,
  calculateTDEE,
  calculateTDEEByActivityLevel,
  createNutritionProfile,
  createUserSettings,
} from "./utils/calculations";
export { default as parseBillingError } from "./utils/parseBillingError";
export * from "./utils/validation";
export * from "./utils/constants";