import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

// Existing rows stay NULL: their progress is from an unknown day, so it reads as 0.
export function habitsPeriodDate(db: Database) {
  addColumnIfMissing(db, "habits", "period_date", "TEXT");
}
