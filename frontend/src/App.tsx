import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotificationManager } from "@/features/notifications/hooks/useNotificationManager";
import { useStore } from "@/store/store";
import { getToken } from "@/utils/token-storage";
import { useNavigate } from "react-router-dom";
import "./style.css";

// Lazy-loaded pages for better performance
const HomePage = React.lazy(
  () => import("./features/macroTracking/pages/HomePage")
);
const SettingsPage = React.lazy(
  () => import("@/features/settings/pages/SettingsPage")
);
const GoalsPage = React.lazy(() => import("@/features/goals/pages/GoalsPage"));
const AuthPage = React.lazy(() => import("@/features/auth/pages/AuthPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const ReportingPage = React.lazy(
  () => import("@/features/reporting/pages/ReportingPage")
); // Updated path
const PricingPage = React.lazy(
  () => import("@/features/pricing/pages/PricingPage")
);
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));

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
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();

  // Sync auth state with token on mount
  useEffect(() => {
    const token = getToken();
    if (!token && isAuthenticated) {
      logout();
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line
  }, [isAuthenticated, logout, navigate]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
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
              !isAuthenticated ? <AuthPage /> : <Navigate to="/home" replace />
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
