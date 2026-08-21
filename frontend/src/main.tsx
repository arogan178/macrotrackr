import React from "react";
import ReactDOM from "react-dom/client";
import { PostHogProvider } from "@posthog/react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import posthog from "posthog-js";

import { ClerkAppShell } from "@/components/auth/ClerkAppShell";

import { initializeAuthTokenProvider } from "./api/core";
import { isClerkAuthMode, runtimeConfig } from "./config/runtime";
import PostHogUserSync from "./lib/posthogIntegration";
import { ProductAnalyticsProvider } from "./lib/productAnalytics";
import {
  localStoragePersister,
  queryClient,
  shouldPersistQuery,
} from "./lib/queryClient";
import { registerStaleChunkRecovery } from "./lib/staleChunkRecovery";
import AppRouter from "./AppRouter";
import { registerServiceWorker } from "./sw-register";

import "./style.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const posthogApiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const posthogConfig =
  posthogApiKey && posthogHost
    ? { apiKey: posthogApiKey, host: posthogHost }
    : null;
const posthogEnabledInDevelopment =
  import.meta.env.VITE_ENABLE_POSTHOG === "true";
const shouldEnablePostHog =
  runtimeConfig.ANALYTICS_MODE === "posthog" &&
  posthogConfig !== null &&
  (import.meta.env.MODE !== "development" || posthogEnabledInDevelopment);

const hasRequiredClerkConfig = !isClerkAuthMode || Boolean(clerkPublishableKey);

if (shouldEnablePostHog && posthogConfig) {
  posthog.init(posthogConfig.apiKey, {
    api_host: posthogConfig.host,
    capture_exceptions: true,
    debug: import.meta.env.MODE === "development",
    defaults: "2026-01-30",
  });
}

// Explicitly initialize auth token provider state before any API call path can run.
initializeAuthTokenProvider();

function RuntimeConfigError() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-semibold">Runtime configuration error</h1>
        <p className="mt-4 text-zinc-300">
          Clerk authentication is enabled but
          <code className="mx-1 rounded-control bg-zinc-800 px-1 py-0.5 text-zinc-100">
            VITE_CLERK_PUBLISHABLE_KEY
          </code>
          is not set.
        </p>
        <p className="mt-2 text-zinc-400">
          Set the variable and redeploy, or run self-hosted mode with
          <code className="mx-1 rounded-control bg-zinc-800 px-1 py-0.5 text-zinc-100">
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
            shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey),
          },
          buster: "macrotrackr-v1",
        }}
      >
        {isClerkAuthMode ? (
          <ClerkAppShell publishableKey={clerkPublishableKey!}>
            {shouldEnablePostHog ? (
              <PostHogProvider client={posthog}>
                <ProductAnalyticsProvider>
                  <AppContent includePostHogSync />
                </ProductAnalyticsProvider>
              </PostHogProvider>
            ) : (
              <AppContent includePostHogSync={false} />
            )}
          </ClerkAppShell>
        ) : shouldEnablePostHog ? (
          <PostHogProvider client={posthog}>
            <ProductAnalyticsProvider>
              <AppContent includePostHogSync />
            </ProductAnalyticsProvider>
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

// Registered before the worker so a stale chunk from a previous build can
// recover even if service worker registration itself fails.
registerStaleChunkRecovery();
registerServiceWorker();
