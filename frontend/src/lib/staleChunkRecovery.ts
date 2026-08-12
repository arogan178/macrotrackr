import { logger } from "@/lib/logger";

/**
 * Recovers from a lazy route failing to load after a deploy.
 *
 * Route chunks are content-hashed and `/assets/` is served immutable, so a
 * deploy replaces every filename. A page that was already open still holds the
 * previous module graph: the next lazy import requests a hash that no longer
 * exists on the server, the dynamic import rejects, and the user gets an error
 * boundary instead of the page they asked for. It bites hardest mid-sign-in,
 * where several routes are visited in quick succession.
 *
 * Reloading fetches a fresh index.html and therefore a valid module graph.
 *
 * Vite raises `vite:preloadError` for these failures. The guard below prevents
 * a reload loop: if the reload does not fix it - a genuinely missing asset, or
 * an offline client - we surface the original error rather than cycling.
 */
const RELOAD_MARKER = "stale-chunk-reloaded-at";
const RELOAD_COOLDOWN_MS = 30_000;

function hasRecentlyReloaded(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_MARKER);
    if (!raw) {
      return false;
    }

    const previous = Number.parseInt(raw, 10);

    return (
      Number.isFinite(previous) && Date.now() - previous < RELOAD_COOLDOWN_MS
    );
  } catch {
    // Private mode or storage disabled: assume no reload, but the marker write
    // below will also fail, so at worst we reload once per failure.
    return false;
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_MARKER, Date.now().toString());
  } catch {
    // Best effort only.
  }
}

export function registerStaleChunkRecovery(): void {
  if (typeof globalThis.addEventListener !== "function") {
    return;
  }

  globalThis.addEventListener("vite:preloadError", (event) => {
    if (hasRecentlyReloaded()) {
      // Let the error propagate to the boundary; reloading again would loop.
      logger.error(
        "Chunk failed to load again after reloading; not retrying",
        (event as Event & { payload?: unknown }).payload,
      );

      return;
    }

    event.preventDefault();
    markReloaded();
    logger.warn("Stale asset detected after deploy; reloading");
    globalThis.location.reload();
  });
}
