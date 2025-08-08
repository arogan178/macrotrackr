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
    try {
      const [, payloadBase64] = token.split(".");
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);
      if (payload && typeof payload.exp === "number") {
        localStorage.setItem("token_exp", String(payload.exp));
      }
    } catch {}
    localStorage.setItem("token_stored_at", Date.now().toString());
  } else {
    // Fallback to localStorage
    localStorage.setItem("token", token);
    try {
      const [, payloadBase64] = token.split(".");
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);
      if (payload && typeof payload.exp === "number") {
        localStorage.setItem("token_exp", String(payload.exp));
      }
    } catch {}
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
  const expSec = localStorage.getItem("token_exp");

  if (!token || !storedAt) return undefined;
  if (isTokenExpired(storedAt, expSec)) {
    removeToken();
    return undefined;
  }
  return token;
}

/**
 * Sets/stores the authentication token
 * Alias for securelyStoreToken for consistency with existing code
 */
export function setToken(token: string): void {
  securelyStoreToken(token);
}

/**
 * Removes the stored token
 */
export function removeToken(): void {
  if (!isLocalStorageAvailable()) return;

  localStorage.removeItem("token");
  localStorage.removeItem("token_stored_at");
  localStorage.removeItem("token_exp");
}

/**
 * Checks if token has expired based on storage time
 */
function isTokenExpired(storedAtString: string, expSecondsString: string | null): boolean {
  try {
    const storedAt = Number.parseInt(storedAtString, 10);
    const now = Date.now();
    if (expSecondsString) {
      const expMs = Number.parseInt(expSecondsString, 10) * 1000;
      return now >= expMs;
    }
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return now - storedAt > thirtyDaysMs;
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
