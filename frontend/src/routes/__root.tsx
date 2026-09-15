import { Suspense, useEffect } from "react";
import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { AnimatePresence, LazyMotion } from "motion/react";

import PageTransition from "@/components/animation/PageTransition";
import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import MainLayout from "@/components/layout/MainLayout";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import { pathNeedsClerk, shouldMountClerk } from "@/config/clerkRuntime";
import { isClerkAuthMode } from "@/config/runtime";
import { usePageMetadata } from "@/hooks";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

import { LoadingFallback } from "./-authGuards";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <Suspense fallback={<div>Not found...</div>}>
      <NotFoundRouteComponent />
    </Suspense>
  ),
});

function NotFoundRouteComponent() {
  // The server serves the SPA shell with a 200 for any unmatched path, so
  // without this every typo and guessed slug is an indexable duplicate.
  usePageMetadata({ title: "Page not found — MacroTrackr", noindex: true });

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold tracking-tighter text-foreground">
        404
      </h1>
      <h2 className="mb-6 text-2xl font-medium text-foreground">
        Page not found
      </h2>
      <p className="mb-8 max-w-md text-muted">
        Sorry, we could not find the page you are looking for.
      </p>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 font-semibold text-black transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}

function RootComponent() {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAppAuthState();
  useRealtimeSync(isLoaded && isSignedIn);

  // This document started on a public route with no session, so no
  // ClerkProvider was mounted. The auth screens call Clerk hooks directly and
  // would throw, so hand the route to a fresh document that does mount it.
  const needsClerkReload =
    isClerkAuthMode && !shouldMountClerk && pathNeedsClerk(location.pathname);

  const clerkReloadHref = location.href;

  useEffect(() => {
    if (needsClerkReload) {
      window.location.assign(clerkReloadHref);
    }
  }, [needsClerkReload, clerkReloadHref]);

  if (needsClerkReload) {
    return <AuthLoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <LazyMotion features={() => import("motion/react").then((module_) => module_.domAnimation)}>
        <div id="app-root" className="relative min-h-screen">
          <TopLoadingBar />
          <GlobalLoadingOverlay />
          <MainLayout>
            <Suspense fallback={<LoadingFallback />}>
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  <Outlet />
                </PageTransition>
              </AnimatePresence>
            </Suspense>
          </MainLayout>
        </div>
      </LazyMotion>
    </ErrorBoundary>
  );
}
