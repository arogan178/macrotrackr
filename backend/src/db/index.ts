import { Database } from "bun:sqlite";

import { config } from "../config";
import { initializeSchema } from "./schema";

function configureDatabase(db: Database) {
  db.exec("PRAGMA journal_mode = WAL;");
}

export function createDatabase(databasePath = config.DATABASE_PATH) {
  const database = new Database(databasePath, { create: true });
  configureDatabase(database);
  return database;
}

export function initializeDatabase(database: Database) {
  initializeSchema(database);

  if (config.NODE_ENV !== "test") {
    console.log(`Database connected at ${config.DATABASE_PATH}`);
  }

  return database;
}

export function createInitializedDatabase(databasePath = config.DATABASE_PATH) {
  return initializeDatabase(createDatabase(databasePath));
}

export const db = createInitializedDatabase();
