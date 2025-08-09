// Register the service worker in production builds to ensure PWA updates are managed.
// This file is safe to import conditionally and won't run in dev.
export async function registerServiceWorker() {
  if (import.meta.env.MODE !== "production") return;
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // ignore registration errors; app still works without SW
  }
}
