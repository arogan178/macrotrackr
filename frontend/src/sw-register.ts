import { isLocalAuthMode } from "./config/runtime";

// Register the service worker in production builds with automatic updates
export async function registerServiceWorker() {
  if (import.meta.env.MODE !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  if (isLocalAuthMode) {
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

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_ACTIVATED") {
        globalThis.location.reload();
      }
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour
  } catch {
    // Service worker registration failed - silently fail in production
  }
}
