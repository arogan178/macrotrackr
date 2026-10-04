import type { Database } from "bun:sqlite";

import { initialTables } from "./0001_initial_tables";
import { usersPasswordResetToken } from "./0002_users_password_reset_token";
import { usersPasswordResetExpires } from "./0003_users_password_reset_expires";
import { usersClerkId } from "./0004_users_clerk_id";
import { usersPlayObfuscatedAccountId } from "./0005_users_play_obfuscated_account_id";
import { userDetailsSwitchingSource } from "./0006_user_details_switching_source";
import { userDetailsUnitSystem } from "./0007_user_details_unit_system";
import { macroEntriesMealType } from "./0008_macro_entries_meal_type";
import { macroEntriesMealName } from "./0009_macro_entries_meal_name";
import { macroEntriesEntryDate } from "./0010_macro_entries_entry_date";
import { macroEntriesEntryTime } from "./0011_macro_entries_entry_time";
import { usersSubscriptionStatus } from "./0012_users_subscription_status";
import { usersStripeCustomerId } from "./0013_users_stripe_customer_id";
import { usersUpdatedAt } from "./0014_users_updated_at";
import { usersNormalizeSubscriptionStatus } from "./0015_users_normalize_subscription_status";
import { subscriptionsProvider } from "./0016_subscriptions_provider";
import { habitsDropAccentColorCheck } from "./0017_habits_drop_accent_color_check";
import { habitsPeriodDate } from "./0018_habits_period_date";
import { habitsFrequency } from "./0019_habits_frequency";
import { macroEntriesIngredients } from "./0020_macro_entries_ingredients";
import { savedMealsIngredients } from "./0021_saved_meals_ingredients";
import { indexes } from "./0022_indexes";

export type Migration = (db: Database) => void;

// Entry N runs once and sets PRAGMA user_version to N. Append only. Never
// edit, reorder or remove an entry that has shipped.
export const migrations: readonly Migration[] = [
  initialTables,
  usersPasswordResetToken,
  usersPasswordResetExpires,
  usersClerkId,
  usersPlayObfuscatedAccountId,
  userDetailsSwitchingSource,
  userDetailsUnitSystem,
  macroEntriesMealType,
  macroEntriesMealName,
  macroEntriesEntryDate,
  macroEntriesEntryTime,
  usersSubscriptionStatus,
  usersStripeCustomerId,
  usersUpdatedAt,
  usersNormalizeSubscriptionStatus,
  subscriptionsProvider,
  habitsDropAccentColorCheck,
  habitsPeriodDate,
  habitsFrequency,
  macroEntriesIngredients,
  savedMealsIngredients,
  indexes,
];
