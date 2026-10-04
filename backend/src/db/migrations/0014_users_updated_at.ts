import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersUpdatedAt(db: Database) {
  addColumnIfMissing(db, "users", "updated_at", "DATETIME");
  db.exec("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
}
