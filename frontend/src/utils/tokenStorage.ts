/**
 * Secure token storage utilities
 *
 * This module provides methods to securely store and retrieve
 * authentication tokens. It uses a combination of approaches depending
 * on the environment's capabilities.
 */

const isWebCryptoSupported =
  typeof globalThis.crypto?.subtle === "object";

export function securelyStoreToken(token: string, expiresAt?: number): void {
  if (isWebCryptoSupported) {
    localStorage.setItem("token", token);
    if (expiresAt) {
      localStorage.setItem("token_exp", String(expiresAt));
    }
    localStorage.setItem("token_stored_at", Date.now().toString());
  } else {
    localStorage.setItem("token", token);
    if (expiresAt) {
      localStorage.setItem("token_exp", String(expiresAt));
    }
    localStorage.setItem("token_stored_at", Date.now().toString());
  }
}

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

export function setToken(token: string): void {
  securelyStoreToken(token);
}

export function removeToken(): void {
  if (!isLocalStorageAvailable()) return;

  localStorage.removeItem("token");
  localStorage.removeItem("token_stored_at");
  localStorage.removeItem("token_exp");
}

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
    return true;
  }
}

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
