import type { Database } from "bun:sqlite";

// SQLite has no ADD COLUMN IF NOT EXISTS, and a database created before
// numbered migrations may already have the column.
export function addColumnIfMissing(
  db: Database,
  table: string,
  column: string,
  definition: string,
) {
  const existing = db
    .query("SELECT 1 FROM pragma_table_info(?) WHERE name = ?")
    .get(table, column);
  if (!existing) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
