import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";

import { getConfig } from "../config";
import { hashPassword } from "../lib/auth/password";
import { deleteAllUserSessions } from "../lib/auth/session";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const [email, ...extraArguments] = process.argv.slice(2);
if (!email?.trim() || extraArguments.length > 0) {
  fail("Usage: bun run reset-password <email>");
}

let config: ReturnType<typeof getConfig>;
try {
  config = getConfig();
} catch {
  fail("The server configuration is invalid. Fix the variables listed above.");
}

if (config.AUTH_MODE !== "local") {
  fail(
    "This server uses AUTH_MODE=clerk, so Clerk owns passwords. Reset it from the Clerk dashboard.",
  );
}

try {
  const db = new Database(config.DATABASE_PATH, { readwrite: true, create: false });
  // The running server holds the same file open; wait out its writes instead of failing.
  db.exec("PRAGMA busy_timeout = 5000;");

  const user = db
    .query<{ id: number; email: string }, [string]>(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    )
    .get(email.trim());
  if (!user) {
    fail(`No account uses ${email.trim()}.`);
  }

  const temporaryPassword = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  db.transaction(() => {
    db.run("UPDATE users SET password = ? WHERE id = ?", [passwordHash, user.id]);
    deleteAllUserSessions(db, user.id);
  })();
  db.close();

  process.stdout.write(
    [
      `Reset the password for ${user.email} and signed out all of their sessions.`,
      "",
      `Temporary password: ${temporaryPassword}`,
      "",
      "Share it with them privately. After signing in they should set a new password in Settings.",
      "",
    ].join("\n"),
  );
} catch (error) {
  fail(
    `Could not update the database at ${config.DATABASE_PATH}: ${error instanceof Error ? error.message : String(error)}`,
  );
}
