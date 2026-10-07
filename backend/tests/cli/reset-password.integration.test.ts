import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Elysia } from "elysia";

import { resetConfigCache } from "../../src/config";
import { initializeSchema } from "../../src/db/schema";
import { resolveSession } from "../../src/lib/auth/session";
import { handleError } from "../../src/lib/http/responses";
import { authRoutes } from "../../src/modules/auth/routes";

const backendDir = resolve(import.meta.dir, "../..");

const localEnv = {
  APP_MODE: "self-hosted",
  AUTH_MODE: "local",
  BILLING_MODE: "disabled",
  ANALYTICS_MODE: "disabled",
};

const clerkEnv = {
  APP_MODE: "managed",
  AUTH_MODE: "clerk",
  BILLING_MODE: "managed",
  ANALYTICS_MODE: "disabled",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  STRIPE_SECRET_KEY: "sk_test_placeholder",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
  STRIPE_PRICE_ID_MONTHLY: "price_monthly",
  STRIPE_PRICE_ID_YEARLY: "price_yearly",
};

describe("bun run reset-password", () => {
  let directory: string;
  let databasePath: string;
  let db: Database;
  let app: Elysia;

  const runCli = (args: string[], env: Record<string, string> = localEnv) => {
    const result = Bun.spawnSync(["bun", "run", "reset-password", ...args], {
      cwd: backendDir,
      env: { PATH: process.env.PATH ?? "", NODE_ENV: "test", DATABASE_PATH: databasePath, ...env },
    });
    return {
      exitCode: result.exitCode,
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
    };
  };

  const login = (email: string, password: string) =>
    app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    );

  const sessionIsValid = (sessionCookie: string) =>
    resolveSession(
      db,
      new Request("http://localhost/api/auth/session", {
        headers: { Cookie: sessionCookie },
      }),
    ) !== null;

  beforeEach(async () => {
    Object.assign(process.env, localEnv);
    resetConfigCache();
    directory = mkdtempSync(join(tmpdir(), "reset-password-"));
    databasePath = join(directory, "macrotrackr.db");
    db = new Database(databasePath);
    db.exec("PRAGMA journal_mode = WAL;");
    initializeSchema(db);
    app = new Elysia()
      .decorate("db", db)
      .onError(({ error, set }) => handleError(error, set))
      .use(authRoutes) as unknown as Elysia;

    const registered = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "ada@example.com",
          password: "original-password",
          firstName: "Ada",
          lastName: "Lovelace",
        }),
      }),
    );
    expect(registered.status).toBe(200);
  });

  afterEach(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("sets a temporary password that signs in, and signs out every old session", async () => {
    const signedIn = await login("ada@example.com", "original-password");
    const oldSessionCookie = signedIn.headers.get("set-cookie")!.split(";")[0]!;
    expect(sessionIsValid(oldSessionCookie)).toBe(true);

    const result = runCli(["ADA@Example.com"]);

    expect(result.exitCode).toBe(0);
    const temporaryPassword = result.stdout.match(/Temporary password: (\S+)/)?.[1];
    expect(temporaryPassword).toHaveLength(24);
    expect(result.stdout).toContain("set a new password in Settings");
    expect(sessionIsValid(oldSessionCookie)).toBe(false);
    expect((await login("ada@example.com", "original-password")).status).toBe(401);
    expect((await login("ada@example.com", temporaryPassword!)).status).toBe(200);
  });

  it("exits non-zero for an unknown email and changes nothing", async () => {
    const result = runCli(["nobody@example.com"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No account uses nobody@example.com.");
    expect((await login("ada@example.com", "original-password")).status).toBe(200);
  });

  it("refuses in Clerk mode", async () => {
    const result = runCli(["ada@example.com"], clerkEnv);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("This server uses AUTH_MODE=clerk");
    expect((await login("ada@example.com", "original-password")).status).toBe(200);
  });

  it("exits non-zero when the database file does not exist", () => {
    databasePath = join(directory, "missing.db");

    const result = runCli(["ada@example.com"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(`Could not update the database at ${databasePath}`);
  });
});
