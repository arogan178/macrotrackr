import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersStripeCustomerId(db: Database) {
  addColumnIfMissing(db, "users", "stripe_customer_id", "TEXT");
}
