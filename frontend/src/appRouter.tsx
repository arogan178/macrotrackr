import "./style.css";

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useLoaderData,
} from "@tanstack/react-router";
import React, { Suspense } from "react";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { billingLoader } from "@/loaders/billingLoader";

import { macroDataLoader } from "@/loaders/macroDataLoader";
import {
  macroTargetLoader,
  macroHomeLoader,
  macroGoalsLoader,
} from "@/loaders/macroTargetLoader";

import MainLayout from "./components/layout/MainLayout";
import { loader as userLoader } from "./loaders/userLoader";

const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));
const LandingPage = React.lazy(
  () => import("./features/landing/pages/LandingPage"),
);
const HomePage = React.lazy(
  () => import("./features/macroTracking/pages/HomePage"),
);
const SettingsPage = React.lazy(
  () => import("@/features/settings/pages/SettingsPage"),
);
const GoalsPage = React.lazy(() => import("@/features/goals/pages/GoalsPage"));
const AuthPage = React.lazy(() => import("@/features/auth/pages/AuthPage"));
const ReportingPage = React.lazy(
  () => import("@/features/reporting/pages/ReportingPage"),
);
const PricingPage = React.lazy(
  () => import("@/features/pricing/pages/PricingPage"),
);
const ResetPasswordPage = React.lazy(
  () => import("./features/landing/pages/ResetPasswordPage"),
);
const TermsAndConditionsPage = React.lazy(
  () => import("./features/landing/pages/TermsAndConditionsPage"),
);
const PrivacyPolicyPage = React.lazy(
  () => import("./features/landing/pages/PrivacyPolicyPage"),
);

// Fallback component to show while loading
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, authRequired } = useLoaderData({ from: rootRoute.id }) as any;
  if (authRequired) {
    if (globalThis.window !== undefined) {
      globalThis.location.replace("/login");
    }
    return;
  }
  return <>{children}</>;
}

// Root route with loader for user data
export const rootRoute = createRootRoute({
  loader: userLoader,
  component: () => (
    <ErrorBoundary>
      <MainLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </MainLayout>
    </ErrorBoundary>
  ),
  notFoundComponent: () => (
    <Suspense fallback={<div>Not found...</div>}>
      <NotFoundPage />
    </Suspense>
  ),
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <LandingPage />,
});

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  loader: macroHomeLoader,
  component: () => (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  loader: billingLoader,
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});
export const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/goals",
  loader: macroGoalsLoader,
  component: () => (
    <RequireAuth>
      <GoalsPage />
    </RequireAuth>
  ),
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <AuthPage />,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: () => <AuthPage />,
});
export const reportingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reporting",
  loader: macroDataLoader,
  component: () => (
    <RequireAuth>
      <ReportingPage />
    </RequireAuth>
  ),
});
const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: () => <PricingPage />,
});
export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: () => <ResetPasswordPage />,
});
const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: () => <TermsAndConditionsPage />,
});
const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: () => <PrivacyPolicyPage />,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  homeRoute,
  settingsRoute,
  goalsRoute,
  loginRoute,
  registerRoute,
  reportingRoute,
  pricingRoute,
  resetPasswordRoute,
  termsRoute,
  privacyRoute,
]);

const router = createRouter({
  routeTree,
});

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
