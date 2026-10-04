import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function habitsFrequency(db: Database) {
  addColumnIfMissing(db, "habits", "frequency", "TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily', 'weekly'))");
}
