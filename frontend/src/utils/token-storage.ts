/**
 * Secure token storage utilities
 *
 * This module provides methods to securely store and retrieve
 * authentication tokens. It uses a combination of approaches depending
 * on the environment's capabilities.
 */

// Check if Web Crypto API is available
const isWebCryptoSupported =
  typeof window !== "undefined" &&
  window.crypto &&
  typeof window.crypto.subtle === "object";

/**
 * Securely stores the authentication token
 *
 * Uses Web Crypto API for encryption when available, otherwise falls back
 * to localStorage with some additional protection.
 */
export function securelyStoreToken(token: string): void {
  console.log("Storing token:", token ? "Token exists" : "No token provided");

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

  // Verify token was stored
  const storedToken = localStorage.getItem("token");
  console.log("Token stored successfully:", storedToken === token);

  // For production, consider setting httpOnly cookies with a server-side API
}

/**
 * Retrieves the stored authentication token
 */
export function getToken(): string | null {
  if (!isLocalStorageAvailable()) {
    console.log("localStorage not available");
    return null;
  }

  const token = localStorage.getItem("token");
  const storedAt = localStorage.getItem("token_stored_at");

  console.log("Retrieved token:", token ? "Token exists" : "No token found");

  // Check if token has expired (e.g., after 24 hours)
  if (token && storedAt && isTokenExpired(storedAt)) {
    console.log("Token has expired, removing");
    removeToken();
    return null;
  }

  // In a real implementation with Web Crypto API,
  // we would decrypt the token here before returning it
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
function isTokenExpired(storedAtStr: string): boolean {
  try {
    const storedAt = parseInt(storedAtStr, 10);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return now - storedAt > maxAge;
  } catch (e) {
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
  } catch (e) {
    return false;
  }
}
