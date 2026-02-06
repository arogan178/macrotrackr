import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./AppRouter";
import PostHogUserSync from "./lib/posthogIntegration";
import { localStoragePersister, queryClient } from "./lib/queryClient";
import { registerServiceWorker } from "./sw-register";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={{
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        defaults: "2025-05-24",
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: localStoragePersister,
          // Only persist queries, not mutations
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Don't persist auth-related queries or mutations
              const queryKey = query.queryKey;
              if (queryKey[0] === "auth") return false;
              if (queryKey[0] === "settings" && queryKey[1] === "user")
                return false;
              if (queryKey[0] === "settings" && queryKey[1] === "billing")
                return false;
              // Persist everything else (goals, macros, habits, etc.)
              return true;
            },
          },
          // Persist immediately when queries update
          buster: "macro-tracker-v1",
        }}
      >
        <PostHogUserSync />
        <AppRouter />
        {/* Only show devtools in development */}
        {import.meta.env.MODE === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </PersistQueryClientProvider>
    </PostHogProvider>
  </React.StrictMode>,
);

// Ensure PWA service worker is registered in production so updates can clean stale caches
registerServiceWorker();
