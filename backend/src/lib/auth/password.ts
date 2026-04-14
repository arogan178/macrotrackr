import { loggerHelpers } from "../observability/logger";

const SALT_ROUNDS = 10; // Standard number of salt rounds for bcrypt

export async function hashPassword(plaintextPassword: string): Promise<string> {
  try {
    const hashed = await Bun.password.hash(plaintextPassword, {
      algorithm: "bcrypt",
      cost: SALT_ROUNDS,
    });
    return hashed;
  } catch (error) {
    loggerHelpers.security(
      "password_hashing_failed",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "high"
    );
    throw new Error("Could not hash password."); // Throw a generic error
  }
}

export async function verifyPassword(
  plaintextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isValid = await Bun.password.verify(plaintextPassword, hashedPassword, "bcrypt");
    return isValid;
  } catch (error) {
    // Log verification errors but typically return false for security
    loggerHelpers.security(
      "password_verification_failed",
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "medium"
    );
    return false; // Treat verification errors as a mismatch
  }
}
