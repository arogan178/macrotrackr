import { onlineManager } from "@tanstack/react-query";

/**
 * An app opened from the cached account has no working Clerk. Clerk never
 * retries a failed load, so only a reload gets a token. Until then the network
 * counts as down, or every request would 401 and send the user to sign in.
 * The reload waits for a moment when it cannot throw away what someone typed.
 */
let isActive = false;
let hasUnsavedInput = false;

function reloadIfIdle(): void {
  if (!navigator.onLine || hasUnsavedInput || document.querySelector('[role="dialog"]')) {
    return;
  }
  globalThis.location.reload();
}

export function isOfflineSession(): boolean {
  return isActive;
}

export function startOfflineSession(): void {
  if (isActive) return;
  isActive = true;

  onlineManager.setEventListener(() => undefined);
  onlineManager.setOnline(false);

  document.addEventListener("input", () => {
    hasUnsavedInput = true;
  }, true);
  document.addEventListener("submit", () => {
    hasUnsavedInput = false;
  }, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reloadIfIdle();
  });
  globalThis.addEventListener("online", reloadIfIdle);
}

/** A screen that just opened holds no input yet, so it is a safe moment. */
export function offlineSessionNavigated(): void {
  if (!isActive) return;
  hasUnsavedInput = false;
  reloadIfIdle();
}
