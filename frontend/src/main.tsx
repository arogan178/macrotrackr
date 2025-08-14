import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./AppRouter";
import { queryClient } from "./lib/queryClient";
import { registerServiceWorker } from "./sw-register";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    {/* Resolve PostHog env vars from Vite. Use VITE_PUBLIC_* (exposed to client) or fall back to non-public names if present. */}
    <PostHogProvider
      apiKey={
        import.meta.env.VITE_PUBLIC_POSTHOG_KEY ||
        import.meta.env.VITE_POSTHOG_API_KEY
      }
      options={{
        api_host:
          import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
          import.meta.env.VITE_POSTHOG_HOST ||
          "https://app.posthog.com",
        // enable exception capture; if you don't want this set to false
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
      {/** Warn at runtime if PostHog isn't configured so developers can notice */}
      {(() => {
        // Only attempt to warn in a browser environment where `window` exists
        if (
          (globalThis as any).window &&
          !(
            import.meta.env.VITE_PUBLIC_POSTHOG_KEY ||
            import.meta.env.VITE_POSTHOG_API_KEY
          )
        ) {
          console.warn(
            "PostHog not configured: no VITE_PUBLIC_POSTHOG_KEY or VITE_POSTHOG_API_KEY found in environment",
          );
        }
        return undefined;
      })()}
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        {/* Only show devtools in development */}
        {import.meta.env.MODE === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>,
);

// Ensure PWA service worker is registered in production so updates can clean stale caches
registerServiceWorker();
