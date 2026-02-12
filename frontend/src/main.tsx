import { ClerkProvider } from "@clerk/clerk-react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./AppRouter";
import { ClerkTokenSync } from "./components/auth/ClerkTokenSync";
import PostHogUserSync from "./lib/posthogIntegration";
import { localStoragePersister, queryClient } from "./lib/queryClient";
import { registerServiceWorker } from "./sw-register";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const posthogApiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const posthogEnabledInDevelopment =
  import.meta.env.VITE_ENABLE_POSTHOG === "true";
const shouldEnablePostHog =
  Boolean(posthogApiKey && posthogHost) &&
  (import.meta.env.MODE !== "development" || posthogEnabledInDevelopment);

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
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

const CLIENT_RESET_VERSION = "2026-02-12-queryclient-hotfix-1";

async function runOneTimeClientReset(): Promise<boolean> {
  if (import.meta.env.MODE !== "production") return false;

  const resetKey = `client-reset:${CLIENT_RESET_VERSION}`;
  if (localStorage.getItem(resetKey) === "done") return false;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    }

    if ("caches" in globalThis) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
    }

    localStorage.removeItem("macro-tracker-query-cache");
    localStorage.setItem(resetKey, "done");

    const reloadUrl = new URL(globalThis.location.href);
    reloadUrl.searchParams.set("cacheReset", CLIENT_RESET_VERSION);
    globalThis.location.replace(reloadUrl.toString());

    return true;
  } catch (error) {
    console.error("[bootstrap] One-time client reset failed:", error);
    return false;
  }
}

function renderApp() {
  ReactDOM.createRoot(document.querySelector("#root")!).render(
    <React.StrictMode>
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
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          afterSignOutUrl="/"
          signInFallbackRedirectUrl="/home"
          signUpFallbackRedirectUrl="/home"
        >
          <ClerkTokenSync />
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
              <AppContent includePostHogSync={true} />
            </PostHogProvider>
          ) : (
            <AppContent includePostHogSync={false} />
          )}
        </ClerkProvider>
      </PersistQueryClientProvider>
    </React.StrictMode>,
  );

  registerServiceWorker();
}

async function bootstrap() {
  const wasResetTriggered = await runOneTimeClientReset();
  if (!wasResetTriggered) {
    renderApp();
  }
}

await bootstrap();
