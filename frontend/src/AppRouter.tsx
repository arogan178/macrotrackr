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
import React, { Suspense } from "react";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import { apiService } from "@/utils/apiServices";
import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";

import MainLayout from "./components/layout/MainLayout";
import { normalizeWeightGoals } from "./features/goals/utils/goalUtilities";
import { queryClient, queryConfigs } from "./lib/queryClient";
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
const SignInPage = React.lazy(
  () => import("@/features/auth/pages/SignInPage"),
);
const SignUpPage = React.lazy(
  () => import("@/features/auth/pages/SignUpPage"),
);
const ProfileSetupPage = React.lazy(
  () => import("@/features/auth/pages/ProfileSetupPage"),
);
const AuthReadyPage = React.lazy(
  () => import("@/features/auth/pages/AuthReadyPage"),
);
const SSOCallbackPage = React.lazy(
  () => import("@/features/auth/pages/SSOCallbackPage"),
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
    return <Navigate to="/login" search={{}} />;
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
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} />;
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
    if (
      error instanceof Error &&
      "status" in error &&
      (error as any).status === 401
    ) {
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
            <Outlet />
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
  validateSearch: (search: Record<string, unknown>) => ({
    limit: Number(search.limit) || 20,
    offset: Number(search.offset) || 0,
  }),
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: async (context_) => {
    const { deps, context } = context_ as typeof context_ & {
      deps: { offset: number; limit: number };
      context: { queryClient: typeof queryClient };
    };

    const limit = deps.limit || 20;
    const offset = deps.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    const [macroTarget, macroHistory, weightGoals, weightLog] =
      await Promise.all([
        safeFetch(
          () =>
            context.queryClient.fetchQuery({
              queryKey: queryKeys.macros.targets(),
              queryFn: () =>
                apiService.macros.getMacroTarget().then((r) => r?.macroTarget),
              ...queryConfigs.macros,
            }),
          undefined,
        ),
        safeFetch(
          () =>
            context.queryClient.fetchQuery({
              queryKey: queryKeys.macros.history(page),
              queryFn: () => apiService.macros.getHistory(limit, offset),
              ...queryConfigs.history,
            }),
          { entries: [], hasMore: false, total: 0 },
        ),
        safeFetch(
          () =>
            context.queryClient.fetchQuery({
              queryKey: queryKeys.goals.weight(),
              queryFn: () =>
                apiService.goals.getWeightGoals().then((r) => r ?? null),
              ...queryConfigs.goals,
            }),
          null,
        ),
        safeFetch(
          () =>
            context.queryClient.fetchQuery({
              queryKey: queryKeys.goals.weightLog(),
              queryFn: () => apiService.goals.getWeightLog(),
              ...queryConfigs.goals,
            }),
          [],
        ),
      ]);

    const latestWeight =
      weightLog && weightLog.length > 0 ? weightLog.at(-1)?.weight : undefined;
    const transformedWeightGoals = weightGoals
      ? normalizeWeightGoals(weightGoals, latestWeight)
      : undefined;

    const history = macroHistory as {
      entries: unknown[];
      hasMore: boolean;
      total: number;
    };

    return {
      macroTarget,
      history: history.entries,
      historyHasMore: history.hasMore,
      historyTotal: history.total,
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
              apiService.macros.getMacroTarget().then((r) => r?.macroTarget),
            ...queryConfigs.macros,
          }),
        undefined,
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.goals.weight(),
            queryFn: () =>
              apiService.goals.getWeightGoals().then((r) => r ?? null),
            ...queryConfigs.goals,
          }),
        null,
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.goals.weightLog(),
            queryFn: () => apiService.goals.getWeightLog(),
            ...queryConfigs.goals,
          }),
        [],
      ),
      safeFetch(
        () =>
          context.queryClient.fetchQuery({
            queryKey: queryKeys.habits.list(),
            queryFn: () => apiService.habits.getHabit(),
            ...queryConfigs.goals,
          }),
        [],
      ),
    ]);

    const latestWeight =
      weightLog && weightLog.length > 0 ? weightLog.at(-1)?.weight : undefined;
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

// New Clerk sign-in route
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
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

    const queryDate = deps.startDate || new Date().toISOString().split("T")[0]!;

    return safeFetch(
      () =>
        context.queryClient.fetchQuery({
          queryKey: queryKeys.macros.dailyTotals(queryDate),
          queryFn: () =>
            apiService.macros.getDailyTotals({
              startDate: deps.startDate,
              endDate: deps.endDate,
            }),
          ...queryConfigs.history,
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
