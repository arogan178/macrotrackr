import { useLocation } from "@tanstack/react-router";
import React, { useMemo } from "react";

import NotificationManager from "@/components/notifications/components/NotificationManager";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { getToken } from "@/utils/tokenStorage";

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

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Use useMemo for route checking to avoid recreating array each render
  const isPublicRoute = useMemo(() => 
    PUBLIC_ROUTES.has(location.pathname),
    [location.pathname]
  );

  // Only fetch user data if we have a token and we're not on a public route
  const hasToken = !!getToken();
  const shouldFetchUser = hasToken && !isPublicRoute;

  // Conditionally use the user query
  const { data: user, isLoading } = useUser({ enabled: shouldFetchUser });
  const isAuthenticated = shouldFetchUser && !!user && !isLoading;

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
