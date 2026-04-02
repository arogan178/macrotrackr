import React, { Suspense } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";

import PageTransition from "@/components/animation/PageTransition";
import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import TopLoadingBar from "@/components/ui/TopLoadingBar";

import MainLayout from "./components/layout/MainLayout";
import { queryClient } from "./lib/queryClient";
import {
  LoadingFallback,
  RequireAuth,
  RequireUnauth,
} from "./routes/authGuards";
import {
  AuthReadyPage,
  GoalsPage,
  HomePage,
  LandingPage,
  NotFoundPage,
  PricingPage,
  PrivacyPolicyPage,
  ProfileSetupPage,
  ReportingPage,
  ResetPasswordPage,
  SettingsPage,
  SignInPage,
  SignUpPage,
  SSOCallbackPage,
  TermsAndConditionsPage,
} from "./routes/lazyPages";

import "./style.css";

// Root route
export const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <div id="app-root" className="relative min-h-screen">
        <TopLoadingBar />
        <GlobalLoadingOverlay />
        <MainLayout>
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <PageTransition key={globalThis.location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </Suspense>
        </MainLayout>
      </div>
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
  component: LandingPage,
});

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <HomePage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab as string | undefined,
  }),
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <SettingsPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});

export const goalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/goals",
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <GoalsPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});

const BlogIndexPage = React.lazy(
  () => import("./features/landing/pages/BlogIndexPage"),
);
const BlogArticlePage = React.lazy(
  () => import("./features/landing/pages/BlogArticlePage"),
);

const blogIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  validateSearch: (search: Record<string, unknown>) => ({
    category: search.category as string | undefined,
    tag: search.tag as string | undefined,
    q: search.q as string | undefined,
  }),
  component: BlogIndexPage,
});

const blogArticleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$slug",
  component: BlogArticlePage,
});

// New Clerk sign-in route
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo as string | undefined,
  }),
  component: () => (
    <RequireUnauth>
      <SignInPage />
    </RequireUnauth>
  ),
});

// New Clerk sign-up route
const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo as string | undefined,
  }),
  component: () => (
    <RequireUnauth>
      <SignUpPage />
    </RequireUnauth>
  ),
});

// Profile setup route - for post-authentication profile creation
const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile-setup",
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: search.redirectTo as string | undefined,
  }),
  component: ProfileSetupPage,
});

// Auth ready route - ensures auth token is set before redirecting to protected routes
const authReadyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth-ready",
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: search.redirectTo as string | undefined,
  }),
  component: AuthReadyPage,
});

// SSO Callback route - handles OAuth redirect from Clerk
const ssoCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sso-callback",
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: search.redirectTo as string | undefined,
    flow: search.flow as string | undefined,
  }),
  component: SSOCallbackPage,
});

export const reportingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reporting",
  validateSearch: (search: Record<string, unknown>) => ({
    startDate: search.startDate as string | undefined,
    endDate: search.endDate as string | undefined,
  }),
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <ReportingPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: PricingPage,
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsAndConditionsPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPolicyPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  homeRoute,
  settingsRoute,
  goalsRoute,
  signInRoute,
  signUpRoute,
  profileSetupRoute,
  authReadyRoute,
  ssoCallbackRoute,
  reportingRoute,
  pricingRoute,
  resetPasswordRoute,
  termsRoute,
  privacyRoute,
  blogIndexRoute,
  blogArticleRoute,
]);

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

// Declare the router context type for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface RouterContext {
    queryClient: typeof queryClient;
  }
}

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
