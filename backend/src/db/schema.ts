// src/db/schema.ts

import { Database } from "bun:sqlite";
import { logger } from "../lib/logger";

/**
 * Initializes the database schema, creating tables and applying migrations.
 * @param db - The Bun SQLite database instance.
 */
export function initializeSchema(db: Database) {
  logger.info("🚀 Initializing database schema...");

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

        -- Weight Goals Table --
        CREATE TABLE IF NOT EXISTS weight_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            starting_weight REAL,
            target_weight REAL,
            weight_goal TEXT CHECK(weight_goal IN ('lose', 'maintain', 'gain')), -- Type of goal
            start_date TEXT, -- YYYY-MM-DD
            target_date TEXT, -- YYYY-MM-DD
            calorie_target REAL, -- Recommended calories for goal
            calculated_weeks INTEGER, -- Estimated duration
            weekly_change REAL, -- Estimated kg/week change
            daily_change REAL, --  Estimated calorie deficit/surplus per day
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );        
        -- Macro Targets Table --
        CREATE TABLE IF NOT EXISTS macro_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            protein_percentage INTEGER DEFAULT 30,
            carbs_percentage INTEGER DEFAULT 40,
            fats_percentage INTEGER DEFAULT 30,
            locked_macros TEXT DEFAULT '[]', -- Store as JSON array string '["protein", "fats"]'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CHECK (protein_percentage + carbs_percentage + fats_percentage = 100),
            CHECK (protein_percentage >= 5 AND protein_percentage <= 70),
            CHECK (carbs_percentage >= 5 AND carbs_percentage <= 70),
            CHECK (fats_percentage >= 5 AND fats_percentage <= 70)
        );

        -- Habits Table --
        CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY NOT NULL,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            icon_name TEXT NOT NULL,
            current INTEGER NOT NULL DEFAULT 0,
            target INTEGER NOT NULL DEFAULT 1,
            accent_color TEXT CHECK(accent_color IN ('indigo', 'blue', 'green', 'purple')),
            is_complete INTEGER NOT NULL DEFAULT 0, -- SQLite boolean (0=false, 1=true)
            created_at TEXT NOT NULL, -- Store as ISO 8601 date-time string
            completed_at TEXT, -- Store as ISO 8601 date-time string, NULL until completed
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- NEW: Weight Log Table --
        CREATE TABLE IF NOT EXISTS weight_log (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL, -- Changed to INTEGER to match users.id
          timestamp TEXT NOT NULL, -- Store as ISO string (YYYY-MM-DD)
          weight REAL NOT NULL, -- Use REAL for floating-point numbers
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

  // --- Simple Migration Logic (Add columns if they don't exist) ---
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
      logger.info(
        `    ➕ Adding column '${columnName}' to table '${tableName}'...`
      );
      try {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
        if (updateLogic) {
          logger.info(
            `       🔄 Running update logic for new column '${columnName}'...`
          );
          db.exec(updateLogic);
        }
      } catch (error) {
        logger.error(
          {
            error: error instanceof Error ? error : new Error(String(error)),
            operation: "add_column",
            tableName,
            columnName,
          },
          `Failed to add column '${columnName}' to '${tableName}'`
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
  logger.info("    ⚡ Creating indexes...");

  // Basic single-column indexes
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date ON macro_entries(user_id, entry_date)"
  );
  db.exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)");
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_goals_user ON weight_goals(user_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_targets_user ON macro_targets(user_id)"
  );

  // Weight log indexes
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_log_user_timestamp ON weight_log(user_id, timestamp)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_log_user_created_at ON weight_log(user_id, created_at)"
  );

  // --- Advanced Compound Indexes for Performance Optimization ---
  logger.info("    🚀 Creating compound performance indexes...");

  // Macro entries optimized for common query patterns
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date_meal ON macro_entries(user_id, entry_date, meal_type)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date_desc ON macro_entries(user_id, entry_date DESC, created_at DESC)"
  );

  // Weight log optimized for chronological queries
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_log_user_timestamp_desc ON weight_log(user_id, timestamp DESC)"
  );

  // Habits optimized for completion status queries
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_habits_user_complete ON habits(user_id, is_complete)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_habits_user_created ON habits(user_id, created_at DESC)"
  );

  // User details lookup optimization
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_user_details_user ON user_details(user_id)"
  );

  logger.info("✅ Database schema initialized successfully.");
}
