import "./style.css";

import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useNotificationManager } from "@/features/notifications/hooks/useNotificationManager";
import { useStore } from "@/store/store.ts";
import { getToken } from "@/utils/tokenStorage";

// Lazy-loaded pages for better performance
const HomePage = React.lazy(
  () => import("./features/macroTracking/pages/HomePage"),
);
const SettingsPage = React.lazy(
  () => import("@/features/settings/pages/SettingsPage"),
);
const GoalsPage = React.lazy(() => import("@/features/goals/pages/GoalsPage"));
const AuthPage = React.lazy(() => import("@/features/auth/pages/AuthPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const ReportingPage = React.lazy(
  () => import("@/features/reporting/pages/ReportingPage"),
); // Updated path
const PricingPage = React.lazy(
  () => import("@/features/pricing/pages/PricingPage"),
);
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const LandingPage = React.lazy(
  () => import("./features/layout/pages/LandingPage"),
);
const TermsAndConditionsPage = React.lazy(
  () => import("./pages/TermsAndConditionsPage"),
);
const PrivacyPolicyPage = React.lazy(() => import("./pages/PrivacyPolicyPage"));

// Loading fallback for lazy-loaded components
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function AppContent() {
  useNotificationManager();
  const isAuthenticated = useStore((state) => state.auth.isAuthenticated);
  const rehydrateAuth = useStore((state) => state.rehydrateAuth);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Persist last visited route (except /login and /)
  useEffect(() => {
    if (
      location.pathname !== "/login" &&
      location.pathname !== "/" &&
      location.pathname !== "/reset-password"
    ) {
      localStorage.setItem(
        "lastVisitedRoute",
        location.pathname + location.search,
      );
    }
  }, [location]);

  // Sync auth state with token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      rehydrateAuth();
    }
    // eslint-disable-next-line
  }, []);

  // If token is missing but store says authenticated, force logout
  useEffect(() => {
    const token = getToken();
    if (!token && isAuthenticated) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, logout, navigate]);

  // On login or refresh, redirect to last visited route if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const lastVisited = localStorage.getItem("lastVisitedRoute");
      // Only redirect if on / or /login
      if (
        location.pathname === "/login" &&
        lastVisited &&
        lastVisited !== location.pathname
      ) {
        navigate(lastVisited, { replace: true });
      }
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/home"
            element={
              isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <SettingsPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/goals"
            element={
              isAuthenticated ? <GoalsPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />
            }
          />
          <Route
            path="/reporting"
            element={
              isAuthenticated ? (
                <ReportingPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms" element={<TermsAndConditionsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
