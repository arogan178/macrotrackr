import { useLocation } from "@tanstack/react-router";
import React from "react";

import { NotificationManager } from "@/components/notifications/components";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { getToken } from "@/utils/tokenStorage";

import Navbar from "./Navbar";

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Define routes that should NOT show the navbar (public routes)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/pricing",
    "/terms",
    "/privacy",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.includes(location.pathname);

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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-primary"
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
