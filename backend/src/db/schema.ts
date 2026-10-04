import type { Database } from "bun:sqlite";

import { logger } from "../lib/observability/logger";
import { type Migration, migrations } from "./migrations";

function readUserVersion(db: Database): number {
  const row = db.query("PRAGMA user_version").get() as { user_version: number };
  return row.user_version;
}

/**
 * Brings the database to the latest schema by running every migration whose
 * number is above PRAGMA user_version, each in its own transaction.
 */
export function initializeSchema(
  db: Database,
  steps: readonly Migration[] = migrations,
) {
  // A table rebuild drops the old table; with foreign keys on, that cascades
  // deletes into every child table. The pragma is ignored inside a transaction.
  db.exec("PRAGMA foreign_keys = OFF;");
  try {
    steps.forEach((migrate, index) => {
      const version = index + 1;
      const applied = db
        .transaction(() => {
          if (readUserVersion(db) >= version) {
            return false;
          }
          migrate(db);
          db.exec(`PRAGMA user_version = ${version};`);
          return true;
        })
        .immediate();
      if (applied) {
        logger.info(`Applied database migration ${version}`);
      }
    });
  } finally {
    db.exec("PRAGMA foreign_keys = ON;");
  }
}
