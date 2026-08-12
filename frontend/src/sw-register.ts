import { Capacitor } from "@capacitor/core";

import { isLocalAuthMode } from "./config/runtime";

// Register the service worker in production builds with automatic updates
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // On Capacitor native apps or local auth mode, PWA service workers must be unregistered
  // to avoid caching stale index.html and chunk hashes that cause asset 404s.
  if (Capacitor.isNativePlatform() || isLocalAuthMode) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    } catch {
      // Cache cleanup is best effort only.
    }

    return;
  }

  if (import.meta.env.MODE !== "production") return;

  try {
    let registration: ServiceWorkerRegistration | null = null;

    // Prefer current VitePWA output name; keep legacy fallback for compatibility.
    for (const swPath of ["/service-worker.js", "/sw.js"]) {
      try {
        registration = await navigator.serviceWorker.register(swPath);
        break;
      } catch {
        // Try next candidate.
      }
    }

    if (!registration) {
      throw new Error("No service worker script found at /service-worker.js or /sw.js");
    }

    // A newly installed worker is intentionally left in the waiting state.
    //
    // Previously this posted SKIP_WAITING as soon as an update installed and
    // then reloaded the page on SW_ACTIVATED. That swapped the asset set under
    // a running page: any lazy route imported afterwards requested a chunk the
    // new worker had already purged and the deploy had removed, which surfaced
    // as "error loading dynamically imported module" and hit the error
    // boundary. The forced reload could also fire mid-sign-in and abandon the
    // OAuth flow.
    //
    // The waiting worker now activates on the next load once no page is using
    // the old build, so a session always sees one consistent build.

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour
  } catch {
    // Service worker registration failed - silently fail in production
  }
}
