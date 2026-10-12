import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

// Daily kcal the user says they burn; NULL means use the formula estimate.
export function userDetailsExpenditureOverride(db: Database) {
  addColumnIfMissing(db, "user_details", "expenditure_override", "INTEGER");
}
