import { Database } from "bun:sqlite";

import { getConfig } from "../config";
import { initializeSchema } from "./schema";

function configureDatabase(db: Database) {
  db.exec("PRAGMA journal_mode = WAL;");
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
    console.log(`Database connected at ${resolvedPath}`);
  }

  return database;
}

export function createInitializedDatabase(databasePath: string) {
  return initializeDatabase(createDatabase(databasePath), databasePath);
}
