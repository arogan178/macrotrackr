import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotificationManager } from "@/features/notifications/hooks/useNotificationManager";
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

// Loading fallback for lazy-loaded components
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function AppContent() {
  // This hook will manage notifications across route changes
  useNotificationManager();

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
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
