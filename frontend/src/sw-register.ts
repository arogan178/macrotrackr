// Register the service worker in production builds with automatic updates
export async function registerServiceWorker() {
  if (import.meta.env.MODE !== "production") return;
  if (!("serviceWorker" in navigator)) return;

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
          // New service worker is installed but waiting
          if (import.meta.env.DEV) {
            console.log("[SW] New version available, skipping waiting...");
          }
          newWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SW_ACTIVATED") {
        if (import.meta.env.DEV) {
          console.log("[SW] Service Worker activated - reloading page for fresh content");
        }
        // Reload the page to get fresh content
        globalThis.location.reload();
      }
    });

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    if (import.meta.env.DEV) console.log("[SW] Service Worker registered successfully");
  } catch (error) {
    if (import.meta.env.DEV) console.error("[SW] Service Worker registration failed:", error);
  }
}
