// src/db/index.ts

import { Database } from "bun:sqlite";
import { initializeSchema } from "./schema";
import { config } from "../config"; // Import validated config

// Create or open the database file using path from config
const db = new Database(config.DATABASE_PATH, { create: true });

// Enable Write-Ahead Logging for better concurrency performance
db.exec("PRAGMA journal_mode = WAL;");

// Run schema initialization and migrations
try {
  initializeSchema(db);
} catch (error) {
  console.error("❌ Fatal error during database initialization:", error);
  process.exit(1); // Exit if critical DB setup fails
}

// Use basic console.log for startup message as logger may not be initialized yet
if (config.NODE_ENV !== "test") {
  console.log(`💾 Database connected at ${config.DATABASE_PATH}`);
}

// Export the initialized database instance
export { db };
