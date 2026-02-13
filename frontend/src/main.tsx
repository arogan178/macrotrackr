import { ClerkProvider } from "@clerk/clerk-react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import ReactDOM from "react-dom/client";

import AppRouter from "./AppRouter";
import { ClerkTokenSync } from "./components/auth/ClerkTokenSync";
import { clerkAppearance } from "./lib/clerkAppearance";
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
        appearance={clerkAppearance}
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
