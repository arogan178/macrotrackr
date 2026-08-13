import React, { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";

import NotificationManager from "@/components/notifications/components/NotificationManager";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAppAuthState } from "@/hooks/auth/useAuthState";

import AppHeader from "./AppHeader";
import OfflineBar from "./OfflineBar";
import PageBackground from "./PageBackground";
import UpdatePrompt from "./UpdatePrompt";

// Static route configuration - defined outside component to avoid recreation
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/reset-password",
]);

// Route trees that render their own public header (features/landing). Without
// these a signed-in user gets two stacked fixed bars on /tools/* and /blog/*.
const PUBLIC_ROUTE_PREFIXES = ["/tools", "/blog"];

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* One instance for the app, rather than a full-viewport mix-blend-overlay
          that re-mounts on every navigation. */}
      <PageBackground />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:rounded-control focus:border focus:border-border-2 focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Skip to content
      </a>
      {isAuthenticated && <AppHeader mode="app" />}
      <main id="main-content" className="relative min-h-screen">
        {children}
      </main>
      <OfflineBar />
      <UpdatePrompt />
      <NotificationManager />
    </div>
  );
};

export default MainLayout;
