import React from "react";
import ReactDOM from "react-dom/client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PostHogProvider } from "posthog-js/react";

import { ClerkAppShell } from "@/components/auth/ClerkAppShell";

import { initializeAuthTokenProvider } from "./api/core";
import { isClerkAuthMode, runtimeConfig } from "./config/runtime";
import PostHogUserSync from "./lib/posthogIntegration";
import { localStoragePersister, queryClient } from "./lib/queryClient";
import AppRouter from "./AppRouter";
import { registerServiceWorker } from "./sw-register";

import "./style.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const posthogApiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const posthogEnabledInDevelopment =
  import.meta.env.VITE_ENABLE_POSTHOG === "true";
const shouldEnablePostHog =
  runtimeConfig.ANALYTICS_MODE === "posthog" &&
  Boolean(posthogApiKey && posthogHost) &&
  (import.meta.env.MODE !== "development" || posthogEnabledInDevelopment);

const hasRequiredClerkConfig = !isClerkAuthMode || Boolean(clerkPublishableKey);

// Explicitly initialize auth token provider state before any API call path can run.
initializeAuthTokenProvider();

function RuntimeConfigError() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-semibold">Runtime configuration error</h1>
        <p className="mt-4 text-zinc-300">
          Clerk authentication is enabled but
          <code className="mx-1 rounded bg-zinc-800 px-1 py-0.5 text-zinc-100">
            VITE_CLERK_PUBLISHABLE_KEY
          </code>
          is not set.
        </p>
        <p className="mt-2 text-zinc-400">
          Set the variable and redeploy, or run self-hosted mode with
          <code className="mx-1 rounded bg-zinc-800 px-1 py-0.5 text-zinc-100">
            VITE_AUTH_MODE=local
          </code>
          .
        </p>
      </section>
    </main>
  );
}

function AppContent({ includePostHogSync }: { includePostHogSync: boolean }) {
  return (
    <>
      {includePostHogSync && <PostHogUserSync />}
      <AppRouter />
      {import.meta.env.MODE === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    {hasRequiredClerkConfig ? (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: localStoragePersister,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              const queryKey = query.queryKey;
              if (queryKey[0] === "auth") return false;
              if (queryKey[0] === "settings" && queryKey[1] === "user")
                return false;
              if (queryKey[0] === "settings" && queryKey[1] === "billing")
                return false;

              return true;
            },
          },
          buster: "macro-tracker-v1",
        }}
      >
        {isClerkAuthMode ? (
          <ClerkAppShell publishableKey={clerkPublishableKey!}>
            {shouldEnablePostHog ? (
              <PostHogProvider
                apiKey={posthogApiKey}
                options={{
                  api_host: posthogHost,
                  defaults: "2025-05-24",
                  capture_exceptions: true,
                  debug: import.meta.env.MODE === "development",
                }}
              >
                <AppContent includePostHogSync />
              </PostHogProvider>
            ) : (
              <AppContent includePostHogSync={false} />
            )}
          </ClerkAppShell>
        ) : shouldEnablePostHog ? (
          <PostHogProvider
            apiKey={posthogApiKey}
            options={{
              api_host: posthogHost,
              defaults: "2025-05-24",
              capture_exceptions: true,
              debug: import.meta.env.MODE === "development",
            }}
          >
            <AppContent includePostHogSync />
          </PostHogProvider>
        ) : (
          <AppContent includePostHogSync={false} />
        )}
      </PersistQueryClientProvider>
    ) : (
      <RuntimeConfigError />
    )}
  </React.StrictMode>,
);

registerServiceWorker();
