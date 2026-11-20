import type { Database } from "bun:sqlite";

// Add sort-covering index for paginated macro history queries and remove
// duplicate indexes that slow down inserts/updates without helping lookups.
export function optimizeIndexes(db: Database) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_macro_entries_history_order
      ON macro_entries(user_id, entry_date DESC, entry_time DESC, created_at DESC);

    DROP INDEX IF EXISTS idx_macro_entries_user_id;
    DROP INDEX IF EXISTS idx_macro_entries_user_date_desc;
    DROP INDEX IF EXISTS idx_goals_user_id;
    DROP INDEX IF EXISTS idx_habits_user_complete;
    DROP INDEX IF EXISTS idx_weight_log_user_timestamp_desc;
  `);
}
