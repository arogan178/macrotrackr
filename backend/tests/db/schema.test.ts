import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("database schema", () => {
  it("stores a fixed switching source on user details", () => {
    const output = execFileSync(
      "bun",
      [
        "--eval",
        [
          'import { Database } from "bun:sqlite";',
          'import { initializeSchema } from "./src/db/schema.ts";',
          'const database = new Database(":memory:");',
          "initializeSchema(database);",
          'const columns = database.query("PRAGMA table_info(user_details)").all();',
          'console.log(columns.some((column) => column.name === "switching_source"));',
          "database.close();",
        ].join(""),
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(output.trim().endsWith("true")).toBe(true);
  });
});
