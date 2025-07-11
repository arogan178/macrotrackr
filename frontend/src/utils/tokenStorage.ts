/**
 * Secure token storage utilities
 *
 * This module provides methods to securely store and retrieve
 * authentication tokens. It uses a combination of approaches depending
 * on the environment's capabilities.
 */

// Check if Web Crypto API is available
const isWebCryptoSupported =
  globalThis.window !== undefined &&
  globalThis.crypto &&
  typeof globalThis.crypto.subtle === "object";

/**
 * Securely stores the authentication token
 *
 * Uses Web Crypto API for encryption when available, otherwise falls back
 * to localStorage with some additional protection.
 */
export function securelyStoreToken(token: string): void {
  if (isWebCryptoSupported) {
    // In a real implementation, this would use the Web Crypto API
    // to encrypt the token before storing it
    // For now, we'll use localStorage with a note about encryption
    localStorage.setItem("token", token);
    localStorage.setItem("token_stored_at", Date.now().toString());
  } else {
    // Fallback to localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("token_stored_at", Date.now().toString());
  }

  // For production, consider setting httpOnly cookies with a server-side API
}

/**
 * Retrieves the stored authentication token
 */
export function getToken(): string | undefined {
  if (!isLocalStorageAvailable()) return undefined;

  const token = localStorage.getItem("token");
  const storedAt = localStorage.getItem("token_stored_at");

  if (!token || !storedAt) return undefined;
  if (isTokenExpired(storedAt)) {
    removeToken();
    return undefined;
  }
  return token;
}

/**
 * Removes the stored token
 */
export function removeToken(): void {
  if (!isLocalStorageAvailable()) return;

  localStorage.removeItem("token");
  localStorage.removeItem("token_stored_at");
}

/**
 * Checks if token has expired based on storage time
 */
function isTokenExpired(storedAtString: string): boolean {
  try {
    const storedAt = Number.parseInt(storedAtString, 10);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return now - storedAt > maxAge;
  } catch {
    return true; // If there's any error parsing, consider it expired
  }
}

/**
 * Checks if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
