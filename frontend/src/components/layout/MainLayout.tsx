import { useLocation } from "@tanstack/react-router";
import React from "react";

import { NotificationManager } from "@/features/notifications/components";
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
  const {
    data: user,
    isLoading,
    error,
  } = useUser({ enabled: shouldFetchUser });
  const isAuthenticated = shouldFetchUser && !!user && !isLoading;

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {isAuthenticated && <Navbar />}
      <main>{children}</main>
      <NotificationManager />
    </div>
  );
};

export default MainLayout;
