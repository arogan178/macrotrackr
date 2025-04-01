// src/db/schema.ts

import { Database } from "bun:sqlite";

/**
 * Initializes the database schema, creating tables and applying migrations.
 * @param db - The Bun SQLite database instance.
 */
export function initializeSchema(db: Database) {
  console.log("🚀 Initializing database schema...");

  // Enable Foreign Key support (important for relationships)
  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize database tables
  db.exec(`
        -- Users Table --
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, -- Store hashed password
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- User Details Table --
        CREATE TABLE IF NOT EXISTS user_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            date_of_birth TEXT, -- Store as ISO 8601 string 'YYYY-MM-DD'
            height REAL,
            weight REAL,
            gender TEXT CHECK(gender IN ('male', 'female')),
            activity_level INTEGER CHECK(activity_level BETWEEN 1 AND 5),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Macro Entries Table --
        CREATE TABLE IF NOT EXISTS macro_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            protein REAL NOT NULL CHECK(protein >= 0.0),
            carbs REAL NOT NULL CHECK(carbs >= 0.0),
            fats REAL NOT NULL CHECK(fats >= 0.0),
            meal_type TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
            meal_name TEXT DEFAULT '',
            entry_date TEXT NOT NULL, -- Store as ISO 8601 string 'YYYY-MM-DD'
            entry_time TEXT NOT NULL, -- Store as ISO 8601 string 'HH:MM:SS' or 'HH:MM'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Macro Distribution Settings Table --
        CREATE TABLE IF NOT EXISTS macro_distribution (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            protein_percentage INTEGER NOT NULL DEFAULT 30,
            carbs_percentage INTEGER NOT NULL DEFAULT 40,
            fats_percentage INTEGER NOT NULL DEFAULT 30,
            locked_macros TEXT DEFAULT '[]', -- Store as JSON array string '["protein", "fats"]'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CHECK (protein_percentage + carbs_percentage + fats_percentage = 100),
            CHECK (protein_percentage >= 5 AND protein_percentage <= 70),
            CHECK (carbs_percentage >= 5 AND carbs_percentage <= 70),
            CHECK (fats_percentage >= 5 AND fats_percentage <= 70)
        );

        -- *** NEW: Weight Goals Table *** --
        CREATE TABLE IF NOT EXISTS weight_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            current_weight REAL,
            target_weight REAL,
            weight_goal TEXT CHECK(weight_goal IN ('lose', 'maintain', 'gain')), -- Type of goal
            start_date TEXT, -- YYYY-MM-DD
            target_date TEXT, -- YYYY-MM-DD
            adjusted_calorie_intake REAL, -- Recommended calories for goal
            calculated_weeks INTEGER, -- Estimated duration
            weekly_change REAL, -- Estimated kg/week change
            daily_deficit REAL, -- Estimated calorie deficit/surplus per day
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- *** NEW: Macro Targets Table *** --
        -- Combines target calories and distribution settings
        CREATE TABLE IF NOT EXISTS macro_targets (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             user_id INTEGER UNIQUE NOT NULL,
             target_calories REAL, -- Target calories (can be different from weight goal adjusted intake)
             -- Store distribution as JSON text, similar to user settings
             macro_distribution TEXT DEFAULT '{}', -- e.g., '{"proteinPercentage":30,"carbsPercentage":40,"fatsPercentage":30}'
             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
             updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
             FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

    `);

  // --- Simple Migration Logic (Add columns if they don't exist) ---
  // This only adds columns, it doesn't create the new tables if they are missing
  // after the initial run. Best to delete the DB file during development if
  // adding new tables via CREATE TABLE IF NOT EXISTS after the DB exists.

  const checkAndAddColumn = (
    tableName: string,
    columnName: string,
    columnDefinition: string,
    updateLogic?: string
  ) => {
    const columnExists = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info(?) WHERE name = ?`
      )
      .get(tableName, columnName) as { count: number };

    if (columnExists.count === 0) {
      console.log(
        `    ➕ Adding column '${columnName}' to table '${tableName}'...`
      );
      try {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
        if (updateLogic) {
          console.log(
            `       🔄 Running update logic for new column '${columnName}'...`
          );
          db.exec(updateLogic);
        }
      } catch (error) {
        console.error(
          `    ❌ Failed to add column '${columnName}' to '${tableName}':`,
          error
        );
      }
    }
  };

  // Apply necessary column additions for existing tables (idempotent)
  checkAndAddColumn(
    "macro_entries",
    "meal_type",
    "TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))"
  );
  checkAndAddColumn("macro_entries", "meal_name", "TEXT DEFAULT ''");
  checkAndAddColumn(
    "macro_entries",
    "entry_date",
    "TEXT",
    "UPDATE macro_entries SET entry_date = DATE(created_at) WHERE entry_date IS NULL"
  );
  checkAndAddColumn(
    "macro_entries",
    "entry_time",
    "TEXT",
    "UPDATE macro_entries SET entry_time = '12:00:00' WHERE entry_time IS NULL"
  );

  // --- Indexes for Performance ---
  console.log("    ⚡ Creating indexes...");
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date ON macro_entries(user_id, entry_date)"
  );
  db.exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  // Add indexes for new tables if needed, e.g., on user_id
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_goals_user ON weight_goals(user_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_targets_user ON macro_targets(user_id)"
  );

  console.log("✅ Database schema initialized successfully.");
}
