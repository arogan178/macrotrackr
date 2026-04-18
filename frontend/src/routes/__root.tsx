import { Suspense } from "react";
import {
  createRootRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";

import PageTransition from "@/components/animation/PageTransition";
import MainLayout from "@/components/layout/MainLayout";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import TopLoadingBar from "@/components/ui/TopLoadingBar";

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
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold tracking-tighter text-foreground">
        404
      </h1>
      <h2 className="mb-6 text-2xl font-medium text-foreground">
        Page not found
      </h2>
      <p className="mb-8 max-w-md text-muted-foreground">
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

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
