import "./style.css";

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import React, { Suspense } from "react";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TopLoadingBar from "@/components/ui/TopLoadingBar";
import { apiService } from "@/utils/apiServices";

import MainLayout from "./components/layout/MainLayout";
import { normalizeWeightGoals } from "./features/goals/utils/goalUtilities";
import { useUser } from "./hooks/auth/useAuthQueries";
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
const AuthPage = React.lazy(() => import("@/features/auth/pages/AuthPage"));
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

// Auth guard component
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!user && globalThis.window !== undefined) {
    globalThis.location.replace("/login");
    return null;
  }

  return <>{children}</>;
}

// Root route with query-based user data prefetching
export const rootRoute = createRootRoute({
  loader: async (context_) => {
    const { context } = context_ as typeof context_ & {
      context: { queryClient: typeof queryClient };
    };

    const { getToken } = await import("@/utils/tokenStorage");
    if (!getToken()) return;

    await context.queryClient.ensureQueryData({
      queryKey: queryKeys.auth.user(),
      queryFn: async () => {
        try {
          return await apiService.user.getUserDetails();
        } catch (error) {
          if (
            error instanceof Error &&
            "status" in error &&
            (error as any).status === 401
          ) {
            return undefined;
          }
          throw error;
        }
      },
      ...queryConfigs.auth,
      retry: false,
    });
  },
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
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.macros.targets(),
          queryFn: () =>
            apiService.macros.getMacroTarget().then((r) => r?.macroTarget),
          ...queryConfigs.macros,
        }),
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.macros.history(page),
          queryFn: () => apiService.macros.getHistory(limit, offset),
          ...queryConfigs.history,
        }),
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.goals.weight(),
          queryFn: () =>
            apiService.goals.getWeightGoals().then((r) => r ?? null),
          ...queryConfigs.goals,
        }),
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.goals.weightLog(),
          queryFn: () => apiService.goals.getWeightLog(),
          ...queryConfigs.goals,
        }),
      ]);

    const latestWeight =
      weightLog.length > 0 ? weightLog.at(-1)?.weight : undefined;
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
      <HomePage />
    </RequireAuth>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  loader: async (context_) => {
    const { context } = context_ as typeof context_ & {
      context: { queryClient: typeof queryClient };
    };

    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.settings.user(),
        queryFn: () => apiService.user.getUserDetails(),
        ...queryConfigs.settings,
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.settings.billing(),
        queryFn: () => apiService.billing.getBillingDetails(),
        ...queryConfigs.settings,
      }),
    ]);

    return {};
  },
  component: () => (
    <RequireAuth>
      <SettingsPage />
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
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.macros.targets(),
        queryFn: () =>
          apiService.macros.getMacroTarget().then((r) => r?.macroTarget),
        ...queryConfigs.macros,
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.goals.weight(),
        queryFn: () => apiService.goals.getWeightGoals().then((r) => r ?? null),
        ...queryConfigs.goals,
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.goals.weightLog(),
        queryFn: () => apiService.goals.getWeightLog(),
        ...queryConfigs.goals,
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.habits.list(),
        queryFn: () => apiService.habits.getHabit(),
        ...queryConfigs.goals,
      }),
    ]);

    const latestWeight =
      weightLog.length > 0 ? weightLog.at(-1)?.weight : undefined;
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
      <GoalsPage />
    </RequireAuth>
  ),
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: AuthPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: AuthPage,
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

    return context.queryClient.ensureQueryData({
      queryKey: queryKeys.macros.dailyTotals(queryDate),
      queryFn: () =>
        apiService.macros.getDailyTotals({
          startDate: deps.startDate,
          endDate: deps.endDate,
        }),
      ...queryConfigs.history,
    });
  },
  component: () => (
    <RequireAuth>
      <ReportingPage />
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
