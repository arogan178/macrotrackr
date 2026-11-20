import { Database } from "bun:sqlite";

import { getConfig } from "../config";
import { initializeSchema } from "./schema";

function configureDatabase(db: Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA cache_size = -64000;
    PRAGMA temp_store = MEMORY;
    PRAGMA mmap_size = 268435456;
  `);
}

export function createDatabase(databasePath: string) {
  const database = new Database(databasePath, { create: true });
  configureDatabase(database);
  return database;
}

export function initializeDatabase(database: Database, databasePath?: string) {
  initializeSchema(database);

  const runtimeConfig = getConfig();
  const resolvedPath = databasePath ?? runtimeConfig.DATABASE_PATH;

  if (runtimeConfig.NODE_ENV !== "test") {
    console.warn(`Database connected at ${resolvedPath}`);
  }

  return database;
}
