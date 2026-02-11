import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "@tanstack/react-router";
import React, { useMemo } from "react";

import NotificationManager from "@/components/notifications/components/NotificationManager";
import { useUser } from "@/hooks/auth/useAuthQueries";

import Navbar from "./Navbar";

// Static route configuration - defined outside component to avoid recreation
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/register",
  "/pricing",
  "/terms",
  "/privacy",
  "/reset-password",
]);

const NO_NAV_ROUTES = new Set([
  "/profile-setup",
  "/auth-ready",
  "/sso-callback",
]);

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  // Use useMemo for route checking to avoid recreating array each render
  const isPublicRoute = useMemo(() => 
    PUBLIC_ROUTES.has(location.pathname),
    [location.pathname]
  );
  const isNoNavRoute = useMemo(
    () => NO_NAV_ROUTES.has(location.pathname),
    [location.pathname]
  );

  // For Clerk auth, rely on Clerk session state rather than legacy local token storage
  const shouldFetchUser = isLoaded && isSignedIn && !isPublicRoute && !isNoNavRoute;

  // Conditionally use the user query
  useUser({ enabled: shouldFetchUser });
  const isAuthenticated = isLoaded && isSignedIn && !isPublicRoute && !isNoNavRoute;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-primary"
      >
        Skip to content
      </a>
      {isAuthenticated && <Navbar />}
      <main id="main-content" className="relative min-h-screen">
        {children}
      </main>
      <NotificationManager />
    </div>
  );
};

export default MainLayout;
