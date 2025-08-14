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
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
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
