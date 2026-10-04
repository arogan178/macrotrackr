import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersPasswordResetToken(db: Database) {
  addColumnIfMissing(db, "users", "password_reset_token", "TEXT");
}
