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
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, -- Store hashed password
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            date_of_birth TEXT, -- Store as ISO 8601 string 'YYYY-MM-DD'
            height REAL, -- Use REAL for floating point numbers (e.g., cm or inches)
            weight REAL, -- Use REAL for floating point numbers (e.g., kg or lbs)
            gender TEXT CHECK(gender IN ('male', 'female')),
            activity_level INTEGER CHECK(activity_level BETWEEN 1 AND 5), -- 1: Sedentary, 5: Extra Active
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- If user is deleted, delete details
        );

        CREATE TABLE IF NOT EXISTS macro_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            protein REAL NOT NULL CHECK(protein >= 0),
            carbs REAL NOT NULL CHECK(carbs >= 0),
            fats REAL NOT NULL CHECK(fats >= 0),
            meal_type TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')), -- Added CHECK constraint
            meal_name TEXT DEFAULT '',
            entry_date TEXT NOT NULL, -- Store as ISO 8601 string 'YYYY-MM-DD'
            entry_time TEXT NOT NULL, -- Store as ISO 8601 string 'HH:MM:SS' or 'HH:MM'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- If user is deleted, delete entries
        );

        CREATE TABLE IF NOT EXISTS macro_distribution (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            protein_percentage INTEGER NOT NULL DEFAULT 30,
            carbs_percentage INTEGER NOT NULL DEFAULT 40,
            fats_percentage INTEGER NOT NULL DEFAULT 30,
            locked_macros TEXT DEFAULT '[]', -- Store as JSON array string '["protein", "fats"]'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- If user is deleted, delete distribution
            -- Constraints ensure data integrity at the DB level
            CHECK (protein_percentage + carbs_percentage + fats_percentage = 100),
            CHECK (protein_percentage >= 5 AND protein_percentage <= 70),
            CHECK (carbs_percentage >= 5 AND carbs_percentage <= 70),
            CHECK (fats_percentage >= 5 AND fats_percentage <= 70)
        );
    `);

  // --- Simple Migration Logic (Add columns if they don't exist) ---
  // This is a basic approach. For complex migrations, consider a dedicated library.
  // NOTE: This simple logic doesn't handle *changing* column types (INTEGER -> REAL).
  // If you have existing data, a more robust migration script might be needed
  // to ALTER TABLE... or create a new table, copy data, drop old, rename new.
  // For a fresh DB or development, simply updating the CREATE TABLE is often sufficient.

  const checkAndAddColumn = (
    tableName: string,
    columnName: string,
    columnDefinition: string,
    updateLogic?: string
  ) => {
    // Check if column exists using PRAGMA table_info
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
        // Add the column
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
        // Optionally run an update script for existing rows
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

  // Apply necessary column additions (idempotent)
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

  console.log("✅ Database schema initialized successfully.");
}
