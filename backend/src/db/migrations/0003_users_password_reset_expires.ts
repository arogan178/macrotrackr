import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersPasswordResetExpires(db: Database) {
  addColumnIfMissing(db, "users", "password_reset_expires", "DATETIME");
}
