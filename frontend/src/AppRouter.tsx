import "./style.css";

import { useAuth } from "@clerk/clerk-react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import React, { Suspense } from "react";

import { PageTransition } from "@/components/animation";
import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import { apiService } from "@/utils/apiServices";
import { todayISO } from "@/utils/dateUtilities";

import MainLayout from "./components/layout/MainLayout";
import type { WeightGoalsResponse } from "./features/goals/types";
import { normalizeWeightGoals } from "./features/goals/utils/goalUtilities";
import { hasStatus, queryClient, queryConfigs } from "./lib/queryClient";
import { queryKeys } from "./lib/queryKeys";

// Lazy loaded page components
const NotFoundPage = React.lazy(() => import("@/components/ui/NotFoundPage"));
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
const SignInPage = React.lazy(() => import("@/features/auth/pages/SignInPage"));
const SignUpPage = React.lazy(() => import("@/features/auth/pages/SignUpPage"));
const ProfileSetupPage = React.lazy(
  () => import("@/features/auth/pages/ProfileSetupPage"),
);
const AuthReadyPage = React.lazy(
  () => import("@/features/auth/pages/AuthReadyPage"),
);
const SSOCallbackPage = React.lazy(
  () => import("@/features/auth/pages/SsoCallbackPage"),
);
const ReportingPage = React.lazy(
  () => import("@/features/reporting/pages/ReportingPage"),
);
const PricingPage = React.lazy(
  () => import("@/features/billing/pages/PricingPage"),
);
const ResetPasswordPage = React.lazy(
  () => import("@/features/auth/pages/ResetPasswordPage"),
);
const TermsAndConditionsPage = React.lazy(
  () => import("./features/landing/pages/TermsAndConditionsPage"),
);
const PrivacyPolicyPage = React.lazy(
  () => import("./features/landing/pages/PrivacyPolicyPage"),
);

// Fallback component for suspense
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// Auth guard component - using Clerk's useAuth
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" search={{ returnTo: undefined }} />;
  }

  return <>{children}</>;
}

// Auth guard for unauthenticated routes
function RequireUnauth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/auth-ready" search={{ redirectTo: "/home" }} />;
  }

  return <>{children}</>;
}

// Helper function to safely fetch data with auth error handling
async function safeFetch<T>(
  fetchFunction: () => Promise<T>,
  defaultValue: T,
): Promise<T> {
  try {
    return await fetchFunction();
  } catch (error) {
    if (error instanceof Error && hasStatus(error) && error.status === 401) {
      return defaultValue;
    }
    throw error;
  }
}

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
  loader: async (context_) => {
    const { context } = context_ as typeof context_ & {
      context: { queryClient: typeof queryClient };
    };

    const [weightGoals, weightLog] = await Promise.all([
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.goals.weight(),
            queryFn: () =>
              apiService.goals.getWeightGoals().then((r) => r ?? null),
            ...queryConfigs.longLived,
          }),
        null as WeightGoalsResponse | null,
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.goals.weightLog(),
            queryFn: () => apiService.goals.getWeightLog(),
            ...queryConfigs.longLived,
          }),
        [] as Awaited<ReturnType<typeof apiService.goals.getWeightLog>>,
      ),
    ]);

    const latestWeight =
      weightLog && weightLog.length > 0
        ? weightLog.at(-1)?.weight
        : undefined;
    const transformedWeightGoals = weightGoals
      ? normalizeWeightGoals(weightGoals, latestWeight)
      : undefined;

    return {
      weightGoals: transformedWeightGoals,
      weightLog: Array.isArray(weightLog) ? weightLog : [],
    };
  },
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
  loader: async (context_) => {
    const { context } = context_ as typeof context_ & {
      context: { queryClient: typeof queryClient };
    };

    const [macroTarget, weightGoals, weightLog] = await Promise.all([
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.macros.targets(),
            queryFn: () =>
              apiService.macros
                .getMacroTarget()
                .then((r) => r?.macroTarget ?? null),
            ...queryConfigs.macros,
          }),
        null,
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.goals.weight(),
            queryFn: () =>
              apiService.goals.getWeightGoals().then((r) => r ?? null),
            ...queryConfigs.longLived,
          }),
        null as WeightGoalsResponse | null,
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.goals.weightLog(),
            queryFn: () => apiService.goals.getWeightLog(),
            ...queryConfigs.longLived,
          }),
        [] as Awaited<ReturnType<typeof apiService.goals.getWeightLog>>,
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.habits.list(),
            queryFn: () => apiService.habits.getHabit(),
            ...queryConfigs.longLived,
          }),
        [],
      ),
    ]);

    const latestWeight =
      weightLog && weightLog.length > 0
        ? weightLog.at(-1)?.weight
        : undefined;
    const transformedWeightGoals = weightGoals
      ? normalizeWeightGoals(weightGoals, latestWeight)
      : undefined;

    return {
      macroTarget,
      weightGoals: transformedWeightGoals,
      weightLog: Array.isArray(weightLog) ? weightLog : [],
    };
  },
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
  loaderDeps: ({ search: { startDate, endDate } }) => ({ startDate, endDate }),
  loader: async (context_) => {
    const { deps, context } = context_ as typeof context_ & {
      deps: { startDate?: string; endDate?: string };
      context: { queryClient: typeof queryClient };
    };

    const queryDate = deps.startDate || todayISO();

    return safeFetch(
      () =>
        context.queryClient.fetchQuery({
          queryKey: queryKeys.macros.dailyTotals(queryDate),
          queryFn: () =>
            apiService.macros.getDailyTotals({
              startDate: deps.startDate,
              endDate: deps.endDate,
            }),
          ...queryConfigs.macros,
        }),
      null,
    );
  },
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
