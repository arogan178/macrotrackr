import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * The migration needs a real bun:sqlite, which the vitest node environment
 * cannot import. Shell out to bun the same way tests/db/schema.test.ts does,
 * run every scenario in one child process, and assert on what it reports.
 */
const PROBE = [
  'import { Database } from "bun:sqlite";',
  'import { initializeSchema } from "./src/db/schema.ts";',

  // The shape subscriptions had before Play billing existed. Anyone upgrading
  // an existing deployment starts here.
  "const legacy = `",
  "  CREATE TABLE users (",
  "    id INTEGER PRIMARY KEY AUTOINCREMENT,",
  "    email TEXT,",
  "    subscription_status TEXT DEFAULT 'free',",
  "    stripe_customer_id TEXT,",
  "    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
  "  );",
  "  CREATE TABLE subscriptions (",
  "    id TEXT PRIMARY KEY,",
  "    user_id INTEGER NOT NULL,",
  "    stripe_subscription_id TEXT UNIQUE NOT NULL,",
  "    status TEXT NOT NULL CHECK(status IN ('active', 'canceled', 'past_due', 'unpaid')),",
  "    current_period_end TEXT NOT NULL,",
  "    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,",
  "    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
  "  );",
  "`;",

  "function legacyDb() {",
  '  const db = new Database(":memory:");',
  "  db.exec(legacy);",
  "  db.exec(\"INSERT INTO users (id, email, subscription_status) VALUES (1, 'paid@example.com', 'pro')\");",
  '  db.exec("INSERT INTO subscriptions (id, user_id, stripe_subscription_id, status, current_period_end) VALUES (\'sub_row_1\', 1, \'sub_stripe_abc\', \'active\', \'2030-01-01T00:00:00.000Z\')");',
  "  return db;",
  "}",

  "function throws(fn) { try { fn(); return false; } catch { return true; } }",

  "const result = {};",

  // Scenario 1: an existing subscriber survives, tagged as stripe.
  "{",
  "  const db = legacyDb();",
  "  initializeSchema(db);",
  '  result.migratedRow = db.prepare("SELECT * FROM subscriptions WHERE id = \'sub_row_1\'").get();',
  '  result.columns = db.prepare("SELECT name FROM pragma_table_info(\'subscriptions\')").all().map((c) => c.name);',
  '  result.playEventsTable = !!db.prepare("SELECT name FROM sqlite_master WHERE type = \'table\' AND name = \'play_billing_events\'").get();',
  "  db.close();",
  "}",

  // Scenario 2: a Play token is now storable, an unknown provider is not.
  "{",
  "  const db = legacyDb();",
  "  initializeSchema(db);",
  '  db.exec("INSERT INTO subscriptions (id, user_id, provider, provider_subscription_id, status, current_period_end) VALUES (\'sub_row_2\', 1, \'play\', \'play_token_xyz\', \'active\', \'2030-01-01T00:00:00.000Z\')");',
  '  result.playRowStored = !!db.prepare("SELECT 1 FROM subscriptions WHERE provider = \'play\' AND provider_subscription_id = \'play_token_xyz\'").get();',
  '  result.unknownProviderRejected = throws(() => db.exec("INSERT INTO subscriptions (id, user_id, provider, provider_subscription_id, status, current_period_end) VALUES (\'sub_row_3\', 1, \'paypal\', \'tok\', \'active\', \'2030-01-01T00:00:00.000Z\')"));',
  "  db.close();",
  "}",

  // Scenario 3: uniqueness is per provider, not global.
  "{",
  "  const db = legacyDb();",
  "  initializeSchema(db);",
  '  result.sameIdOtherProviderAllowed = !throws(() => db.exec("INSERT INTO subscriptions (id, user_id, provider, provider_subscription_id, status, current_period_end) VALUES (\'sub_row_4\', 1, \'play\', \'sub_stripe_abc\', \'active\', \'2030-01-01T00:00:00.000Z\')"));',
  '  result.duplicateSameProviderRejected = throws(() => db.exec("INSERT INTO subscriptions (id, user_id, provider, provider_subscription_id, status, current_period_end) VALUES (\'sub_row_5\', 1, \'play\', \'sub_stripe_abc\', \'active\', \'2030-01-01T00:00:00.000Z\')"));',
  "  db.close();",
  "}",

  // Scenario 4a: the Play account token column and its unique index.
  "{",
  "  const db = legacyDb();",
  "  initializeSchema(db);",
  '  result.userColumns = db.prepare("SELECT name FROM pragma_table_info(\'users\')").all().map((c) => c.name);',
  '  db.exec("UPDATE users SET play_obfuscated_account_id = \'tok_one\' WHERE id = 1");',
  '  db.exec("INSERT INTO users (id, email, subscription_status) VALUES (2, \'b@example.com\', \'free\')");',
  // Two accounts sharing a token would resolve a purchase to the wrong user.
  '  result.duplicateAccountTokenRejected = throws(() => db.exec("UPDATE users SET play_obfuscated_account_id = \'tok_one\' WHERE id = 2"));',
  // Null must stay repeatable: most accounts never buy through Play.
  '  db.exec("INSERT INTO users (id, email, subscription_status) VALUES (3, \'c@example.com\', \'free\')");',
  '  result.multipleNullTokensAllowed = db.prepare("SELECT COUNT(*) as count FROM users WHERE play_obfuscated_account_id IS NULL").get().count >= 2;',
  "  db.close();",
  "}",

  // Scenario 4: running the migration twice must not duplicate or drop rows.
  "{",
  "  const db = legacyDb();",
  "  initializeSchema(db);",
  "  initializeSchema(db);",
  '  result.rowCountAfterTwoRuns = db.prepare("SELECT COUNT(*) as count FROM subscriptions").get().count;',
  "  db.close();",
  "}",

  'console.log("__RESULT__" + JSON.stringify(result));',
].join("\n");

interface ProbeResult {
  migratedRow: {
    id: string;
    user_id: number;
    provider: string;
    provider_subscription_id: string;
    status: string;
    current_period_end: string;
  };
  columns: string[];
  playEventsTable: boolean;
  playRowStored: boolean;
  unknownProviderRejected: boolean;
  sameIdOtherProviderAllowed: boolean;
  duplicateSameProviderRejected: boolean;
  rowCountAfterTwoRuns: number;
  userColumns: string[];
  duplicateAccountTokenRejected: boolean;
  multipleNullTokensAllowed: boolean;
}

function runProbe(): ProbeResult {
  const output = execFileSync("bun", ["--eval", PROBE], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const marker = output.lastIndexOf("__RESULT__");
  if (marker === -1) {
    throw new Error(`Migration probe produced no result:\n${output}`);
  }
  return JSON.parse(output.slice(marker + "__RESULT__".length)) as ProbeResult;
}

const probe = runProbe();

describe("subscriptions provider migration", () => {
  it("carries an existing Stripe subscriber across and tags them as stripe", () => {
    expect(probe.migratedRow).toBeTruthy();
    expect(probe.migratedRow.provider).toBe("stripe");
    expect(probe.migratedRow.provider_subscription_id).toBe("sub_stripe_abc");
    expect(probe.migratedRow.status).toBe("active");
    expect(probe.migratedRow.current_period_end).toBe(
      "2030-01-01T00:00:00.000Z",
    );
    expect(probe.migratedRow.user_id).toBe(1);
  });

  it("drops the Stripe-specific column so nothing can write to it again", () => {
    expect(probe.columns).toContain("provider");
    expect(probe.columns).toContain("provider_subscription_id");
    expect(probe.columns).not.toContain("stripe_subscription_id");
  });

  it("accepts a Play purchase token after migrating", () => {
    expect(probe.playRowStored).toBe(true);
  });

  it("rejects a provider it does not know about", () => {
    expect(probe.unknownProviderRejected).toBe(true);
  });

  it("scopes uniqueness to one provider rather than globally", () => {
    expect(probe.sameIdOtherProviderAllowed).toBe(true);
    expect(probe.duplicateSameProviderRejected).toBe(true);
  });

  it("is safe to run twice", () => {
    expect(probe.rowCountAfterTwoRuns).toBe(1);
  });

  it("adds the Play account token column to users", () => {
    expect(probe.userColumns).toContain("play_obfuscated_account_id");
  });

  it("refuses to let two accounts share one Play account token", () => {
    expect(probe.duplicateAccountTokenRejected).toBe(true);
  });

  it("lets accounts that never bought through Play leave it null", () => {
    expect(probe.multipleNullTokensAllowed).toBe(true);
  });

  it("creates the Play notification dedupe table", () => {
    expect(probe.playEventsTable).toBe(true);
  });
});
