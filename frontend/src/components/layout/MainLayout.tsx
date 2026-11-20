import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";

import NotificationManager from "@/components/notifications/components/NotificationManager";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { useAppOpenedEvent } from "@/hooks/useAppOpenedEvent";
import { openLogSheet, useLogSheet } from "@/lib/logSheet";
import { isNativePlatform } from "@/services/native/platform";

import AppHeader from "./AppHeader";
import InstallPrompt from "./InstallPrompt";
import MobileTabBar from "./MobileTabBar";
import OfflineBar from "./OfflineBar";
import PageBackground from "./PageBackground";
import UpdatePrompt from "./UpdatePrompt";

// Static route configuration - defined outside component to avoid recreation
const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/contact",
  "/delete-account",
  "/login",
  "/open-source",
  "/privacy",
  "/register",
  "/reset-password",
  "/terms",
]);

// Route trees that render their own public header (features/landing). Without
// these a signed-in user gets two stacked fixed bars on public pages.
const PUBLIC_ROUTE_PREFIXES = ["/tools", "/blog", "/compare", "/migrate"];

const NO_NAV_ROUTES = new Set([
  "/profile-setup",
  "/auth-ready",
  "/sso-callback",
]);

export const isPublicPathname = (pathname: string): boolean =>
  PUBLIC_ROUTES.has(pathname) ||
  PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

// Keep Modal + form skeleton off public routes and initial authenticated paint.
const LogSheet = React.lazy(
  () => import("@/features/macroTracking/components/LogSheet"),
);
// Reminders only exist in the app; the web never downloads the plugin.
const MealReminders = React.lazy(() => import("@/features/reminders/MealReminders"));

// Scoped to the authenticated shell so leaving to a public route clears open state,
// while staying mounted inside the shell so a cold-load Log tap is never dropped.
function AuthenticatedLogSheet() {
  const [isLogSheetOpen, setLogSheetOpen] = useLogSheet();
  const [logSheetMounted, setLogSheetMounted] = useState(isLogSheetOpen);
  const [openedLogByShortcut, setOpenedLogByShortcut] = useState(isLogSheetOpen);
  if (isLogSheetOpen && !logSheetMounted) {
    setLogSheetMounted(true);
  }
  const handleLogSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setOpenedLogByShortcut(false);
      setLogSheetOpen(open);
    },
    [setLogSheetOpen],
  );

  if (!logSheetMounted) return null;

  return (
    <Suspense fallback={null}>
      <LogSheet
        isOpen={isLogSheetOpen}
        onOpenChange={handleLogSheetOpenChange}
        openedByShortcut={openedLogByShortcut}
      />
    </Suspense>
  );
}

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAppAuthState();

  // Use useMemo for route checking to avoid recreating array each render
  const isPublicRoute = useMemo(
    () => isPublicPathname(location.pathname),
    [location.pathname],
  );
  const isNoNavRoute = useMemo(
    () => NO_NAV_ROUTES.has(location.pathname),
    [location.pathname],
  );

  // For Clerk auth, rely on Clerk session state rather than legacy local token storage
  const shouldFetchUser =
    isLoaded && isSignedIn && !isPublicRoute && !isNoNavRoute;

  // Conditionally use the user query
  useUser({ enabled: shouldFetchUser });
  const isAuthenticated =
    isLoaded && isSignedIn && !isPublicRoute && !isNoNavRoute;
  useAppOpenedEvent(isAuthenticated);

  return (
    <div
      className={`min-h-dvh bg-background text-foreground ${
        isAuthenticated ? "app-shell-headerless" : ""
      }`}
    >
      {/* One instance for the app, rather than a full-viewport mix-blend-overlay
          that re-mounts on every navigation. */}
      <PageBackground />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-90 focus:rounded-control focus:border focus:border-border-2 focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Skip to content
      </a>
      {/* Phone-sized, the app header held nothing but the wordmark: its nav is
          `hidden md:flex` and MobileTabBar already carries all four
          destinations. Hidden rather than removed so the desktop bar stays. */}
      {isAuthenticated && (
        <div className="hidden md:block">
          <AppHeader mode="app" />
        </div>
      )}
      <main
        id="main-content"
        className={`relative min-h-dvh ${
          isAuthenticated ? "pb-[calc(4.5rem+var(--sab))] md:pb-0" : ""
        }`}
      >
        {children}
      </main>
      {/* The app draws edge to edge; without a fill, scrolled content runs
          under the status bar's clock and icons. Zero height on the web. */}
      {isAuthenticated && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-70 h-(--sat) bg-background md:hidden"
        />
      )}
      {isAuthenticated && <MobileTabBar onLog={openLogSheet} />}
      {isAuthenticated && <AuthenticatedLogSheet />}
      {isAuthenticated && isNativePlatform() && (
        <Suspense fallback={null}>
          <MealReminders />
        </Suspense>
      )}
      <OfflineBar />
      <InstallPrompt clearsTabBar={isAuthenticated} />
      <UpdatePrompt />
      <NotificationManager />
    </div>
  );
};

export default MainLayout;
