// src/lib/password.ts
import { hash as bcryptHash, verify as bcryptVerify } from "@node-rs/bcrypt";

const SALT_ROUNDS = 10; // Standard number of salt rounds for bcrypt

/**
 * Hashes a plain text password using bcrypt.
 * @param plaintextPassword The password to hash.
 * @returns A promise that resolves to the hashed password string.
 * @throws Throws an error if hashing fails.
 */
export async function hashPassword(plaintextPassword: string): Promise<string> {
  try {
    const hashed = await bcryptHash(plaintextPassword, SALT_ROUNDS);
    return hashed;
  } catch (error) {
    console.error("Password hashing error:", error);
    throw new Error("Could not hash password."); // Throw a generic error
  }
}

/**
 * Verifies a plain text password against a stored bcrypt hash.
 * @param plaintextPassword The password entered by the user.
 * @param hashedPassword The stored hash from the database.
 * @returns A promise that resolves to true if the password matches the hash, false otherwise.
 */
export async function verifyPassword(
  plaintextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isValid = await bcryptVerify(plaintextPassword, hashedPassword);
    return isValid;
  } catch (error) {
    // Log verification errors but typically return false for security
    console.error("Password verification error:", error);
    return false; // Treat verification errors as a mismatch
  }
}
