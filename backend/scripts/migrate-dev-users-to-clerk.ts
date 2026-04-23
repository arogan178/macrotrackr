import { createClerkClient } from "elysia-clerk";
import { Database } from "bun:sqlite";
import crypto from "crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

type LocalUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  password: string | null;
  clerk_id: string | null;
};

type ClerkUserSummary = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

type Options = {
  dryRun: boolean;
  createMissingClerk: boolean;
  createMissingLocal: boolean;
  importPasswordHashes: boolean;
  requireBcrypt: boolean;
};

export function getClerkErrorMetadata(error: unknown): {
  status?: number;
  code?: string;
  messages: string[];
} {
  const anyError = error as Record<string, unknown>;
  const messages: string[] = [];
  const errors = Array.isArray(anyError?.errors) ? anyError.errors : [];
  for (const item of errors) {
    if (item?.longMessage) messages.push(String(item.longMessage));
    else if (item?.message) messages.push(String(item.message));
    else if (item?.code) messages.push(String(item.code));
  }
  return {
    status: typeof anyError?.status === "number" ? anyError.status : undefined,
    code: typeof anyError?.code === "string" ? anyError.code : undefined,
    messages,
  };
}

export function parseOptions(argv: string[]): Options {
  return {
    dryRun: argv.includes("--dry-run"),
    createMissingClerk: !argv.includes("--no-create-clerk"),
    createMissingLocal: !argv.includes("--no-create-local"),
    importPasswordHashes: !argv.includes("--use-temp-passwords"),
    requireBcrypt: !argv.includes("--allow-non-bcrypt"),
  };
}

export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function splitNameFromEmail(email: string): { first: string; last: string } {
  const localPart = email.split("@")[0] || "user";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  const [first = "User", ...rest] = cleaned.split(" ");
  const last = rest.join(" ").trim() || "Account";
  return {
    first: first.charAt(0).toUpperCase() + first.slice(1),
    last: last.charAt(0).toUpperCase() + last.slice(1),
  };
}

export function generateTempPassword(): string {
  // Strong dev migration password to satisfy Clerk instance password policy.
  // Users can reset/change it in Clerk flows as needed.
  return `DevMigrate!${crypto.randomUUID()}aA1`;
}

export function isBcryptHash(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

export async function fetchAllClerkUsers(
  clerk: ReturnType<typeof createClerkClient>
): Promise<ClerkUserSummary[]> {
  const all: ClerkUserSummary[] = [];
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const page = await clerk.users.getUserList({
      limit: pageSize,
      offset,
    });

    for (const user of page.data) {
      all.push({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
      });
    }

    if (page.data.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

export function createDefaultLocalUserData(clerkUser: ClerkUserSummary) {
  const normalizedEmail = normalizeEmail(clerkUser.email);
  if (!normalizedEmail) return null;

  const generated = splitNameFromEmail(normalizedEmail);
  return {
    email: normalizedEmail,
    firstName: clerkUser.firstName || generated.first,
    lastName: clerkUser.lastName || generated.last,
  };
}

export async function main() {
  const options = parseOptions(process.argv.slice(2));
  const databasePath = process.env.DATABASE_PATH || "./macrotrackr.db";
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Missing CLERK_SECRET_KEY. Run with backend env loaded (e.g. dotenvx + .env.development)."
    );
  }

  const clerk = createClerkClient({ secretKey });
  const db = new Database(databasePath, { create: true });

  const stats = {
    linkedLocalToExistingClerk: 0,
    createdClerkUsers: 0,
    createdClerkUsersWithImportedHash: 0,
    createdClerkUsersWithTempPassword: 0,
    linkedClerkToExistingLocal: 0,
    createdLocalUsers: 0,
    skippedNoEmail: 0,
    skippedInvalidHash: 0,
    skippedFailures: 0,
  };

  console.log("Starting dev user migration/merge...");
  console.log(
    JSON.stringify(
      {
        databasePath,
        dryRun: options.dryRun,
        createMissingClerk: options.createMissingClerk,
        createMissingLocal: options.createMissingLocal,
        importPasswordHashes: options.importPasswordHashes,
        requireBcrypt: options.requireBcrypt,
      },
      null,
      2
    )
  );

  const localUsers = db
    .prepare(
      `SELECT id, email, first_name, last_name, password, clerk_id
       FROM users
       ORDER BY id ASC`
    )
    .all() as LocalUser[];

  const clerkUsers = await fetchAllClerkUsers(clerk);

  const localByClerkId = new Map<string, LocalUser>();
  const localByEmail = new Map<string, LocalUser>();
  for (const localUser of localUsers) {
    if (localUser.clerk_id) localByClerkId.set(localUser.clerk_id, localUser);
    const email = normalizeEmail(localUser.email);
    if (email && !localByEmail.has(email)) {
      localByEmail.set(email, localUser);
    }
  }

  const clerkById = new Map<string, ClerkUserSummary>();
  const clerkByEmail = new Map<string, ClerkUserSummary>();
  for (const clerkUser of clerkUsers) {
    clerkById.set(clerkUser.id, clerkUser);
    const email = normalizeEmail(clerkUser.email);
    if (email && !clerkByEmail.has(email)) {
      clerkByEmail.set(email, clerkUser);
    }
  }

  const updateLocalClerkId = db.prepare(
    "UPDATE users SET clerk_id = ? WHERE id = ?"
  );
  const insertUser = db.prepare(
    "INSERT INTO users (email, first_name, last_name, clerk_id, password) VALUES (?, ?, ?, ?, ?)"
  );
  const insertUserDetails = db.prepare(
    `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
     VALUES (?, NULL, NULL, NULL, NULL, NULL)`
  );
  const insertMacroTargets = db.prepare(
    `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
     VALUES (?, 30, 40, 30, '[]')`
  );

  async function createOrLinkClerkUserFromLocal(localUser: LocalUser) {
    const localEmail = normalizeEmail(localUser.email);
    if (!localEmail) {
      stats.skippedNoEmail++;
      return;
    }

    const nameFromEmail = splitNameFromEmail(localEmail);
    const firstName = (localUser.first_name || "").trim() || nameFromEmail.first;
    const lastName = (localUser.last_name || "").trim() || nameFromEmail.last;
    const shouldImportPasswordHash = options.importPasswordHashes;
    const hasBcryptHash = isBcryptHash(localUser.password);

    if (shouldImportPasswordHash && options.requireBcrypt && !hasBcryptHash) {
      stats.skippedInvalidHash++;
      throw new Error(
        `Local user ${localUser.id} has no valid bcrypt hash; rerun with --allow-non-bcrypt or --use-temp-passwords.`
      );
    }

    const linkToExistingByEmail = async () => {
      const existing = await clerk.users.getUserList({
        emailAddress: [localEmail],
        limit: 1,
      });
      const existingUser = existing.data[0];
      if (!existingUser) return false;
      if (!options.dryRun) {
        updateLocalClerkId.run(existingUser.id, localUser.id);
      }
      stats.linkedLocalToExistingClerk++;
      return true;
    };

    if (options.dryRun) {
      stats.createdClerkUsers++;
      if (shouldImportPasswordHash && hasBcryptHash) {
        stats.createdClerkUsersWithImportedHash++;
      } else {
        stats.createdClerkUsersWithTempPassword++;
      }
      return;
    }

    const createParamsBase = {
      emailAddress: [localEmail],
      firstName,
      lastName,
    } as const;

    const createParamsWithExternalId = shouldImportPasswordHash && hasBcryptHash
      ? {
          ...createParamsBase,
          externalId: String(localUser.id),
          passwordDigest: localUser.password!,
          passwordHasher: "bcrypt" as const,
        }
      : {
          ...createParamsBase,
          externalId: String(localUser.id),
          password: generateTempPassword(),
        };

    const createParamsWithoutExternalId = shouldImportPasswordHash && hasBcryptHash
      ? {
          ...createParamsBase,
          passwordDigest: localUser.password!,
          passwordHasher: "bcrypt" as const,
        }
      : {
          ...createParamsBase,
          password: generateTempPassword(),
        };

    const incrementCreatedCounters = () => {
      stats.createdClerkUsers++;
      if (shouldImportPasswordHash && hasBcryptHash) {
        stats.createdClerkUsersWithImportedHash++;
      } else {
        stats.createdClerkUsersWithTempPassword++;
      }
    };

    // First attempt: include externalId for strong linkage.
    try {
      const created = await clerk.users.createUser(createParamsWithExternalId);
      updateLocalClerkId.run(created.id, localUser.id);
      incrementCreatedCounters();
      return;
    } catch (error) {
      const meta = getClerkErrorMetadata(error);

      // If email exists already or externalId conflicts, link existing by email.
      const linked = await linkToExistingByEmail();
      if (linked) return;

      // Second attempt: retry without externalId in case it is the invalid/conflicting field.
      if (meta.status === 422) {
        try {
          const created = await clerk.users.createUser(createParamsWithoutExternalId);
          updateLocalClerkId.run(created.id, localUser.id);
          incrementCreatedCounters();
          return;
        } catch (retryError) {
          const retryMeta = getClerkErrorMetadata(retryError);
          throw new Error(
            `Clerk createUser failed (status=${retryMeta.status ?? "?"}, code=${retryMeta.code ?? "?"}): ${
              retryMeta.messages.join(" | ") || String(retryError)
            }`
          );
        }
      }

      throw new Error(
        `Clerk createUser failed (status=${meta.status ?? "?"}, code=${meta.code ?? "?"}): ${
          meta.messages.join(" | ") || String(error)
        }`
      );
    }
  }

  // Phase 1: local -> Clerk (link existing or create missing Clerk users)
  for (const localUser of localUsers) {
    try {
      const localEmail = normalizeEmail(localUser.email);
      if (!localEmail) {
        stats.skippedNoEmail++;
        continue;
      }

      if (localUser.clerk_id && clerkById.has(localUser.clerk_id)) {
        continue;
      }

      const existingClerk = clerkByEmail.get(localEmail);
      if (existingClerk) {
        if (!options.dryRun) {
          updateLocalClerkId.run(existingClerk.id, localUser.id);
        }
        stats.linkedLocalToExistingClerk++;
        continue;
      }

      if (!options.createMissingClerk) continue;
      await createOrLinkClerkUserFromLocal(localUser);
    } catch (error) {
      stats.skippedFailures++;
      console.error(
        `Failed local->Clerk migration for local user ${localUser.id}:`,
        error
      );
    }
  }

  // Refresh local maps after phase 1 in case we linked/created IDs
  const updatedLocalUsers = db
    .prepare(
      `SELECT id, email, first_name, last_name, password, clerk_id
       FROM users
       ORDER BY id ASC`
    )
    .all() as LocalUser[];
  localByClerkId.clear();
  localByEmail.clear();
  for (const localUser of updatedLocalUsers) {
    if (localUser.clerk_id) localByClerkId.set(localUser.clerk_id, localUser);
    const email = normalizeEmail(localUser.email);
    if (email && !localByEmail.has(email)) {
      localByEmail.set(email, localUser);
    }
  }

  // Phase 2: Clerk -> local (link by email or create local users)
  for (const clerkUser of clerkUsers) {
    try {
      if (localByClerkId.has(clerkUser.id)) {
        continue;
      }

      const clerkEmail = normalizeEmail(clerkUser.email);
      if (!clerkEmail) {
        stats.skippedNoEmail++;
        continue;
      }

      const existingLocal = localByEmail.get(clerkEmail);
      if (existingLocal) {
        if (!options.dryRun) {
          updateLocalClerkId.run(clerkUser.id, existingLocal.id);
        }
        stats.linkedClerkToExistingLocal++;
        continue;
      }

      if (!options.createMissingLocal) continue;

      const defaults = createDefaultLocalUserData(clerkUser);
      if (!defaults) {
        stats.skippedNoEmail++;
        continue;
      }

      if (!options.dryRun) {
        const result = insertUser.run(
          defaults.email,
          defaults.firstName,
          defaults.lastName,
          clerkUser.id,
          "clerk-auth"
        );
        const userId = Number(result.lastInsertRowid);
        insertUserDetails.run(userId);
        insertMacroTargets.run(userId);
      }

      stats.createdLocalUsers++;
    } catch (error) {
      stats.skippedFailures++;
      console.error(
        `Failed Clerk->local migration for Clerk user ${clerkUser.id}:`,
        error
      );
    }
  }

  console.log("Migration completed.");
  console.table(stats);

  if (options.dryRun) {
    console.log("Dry run mode: no changes were persisted.");
  }
}

function isDirectExecution(): boolean {
  const entryPoint = process.argv[1];
  if (!entryPoint) return false;

  return resolve(entryPoint) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}
