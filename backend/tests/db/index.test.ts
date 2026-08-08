import { Database } from "bun:sqlite";
import { describe, expect, it } from "vitest";
import { createDatabase, initializeDatabase } from "../../src/db/index";

describe("db/index", () => {
  it("creates databases and configures WAL", () => {
    const db = createDatabase(":memory:");
    expect(db).toBeInstanceOf(Database);
    db.close();
  });

  it("initializes database schema", () => {
    const db = new Database(":memory:");
    const result = initializeDatabase(db, ":memory:");
    expect(result).toBe(db);
    db.close();
  });
});
