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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { apiService } from "@/utils/apiServices";

import MainLayout from "./components/layout/MainLayout";
import { useUser } from "./hooks/auth/useAuthQueries";
import { queryClient } from "./lib/queryClient";
import { queryKeys } from "./lib/queryKeys";

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
const LoadingStateDemoPage = React.lazy(
  () => import("./pages/LoadingStateDemoPage"),
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
  const { data: user, isLoading } = useUser();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (globalThis.window !== undefined) {
      globalThis.location.replace("/login");
    }
    return;
  }

  return <>{children}</>;
}

// Root route with query-based user data prefetching
export const rootRoute = createRootRoute({
  loader: async ({ context }) => {
    // Only prefetch user data if there's a token
    const { getToken } = await import("@/utils/tokenStorage");

    if (getToken()) {
      // Prefetch user data using TanStack Query
      await context.queryClient.ensureQueryData({
        queryKey: queryKeys.auth.user(),
        queryFn: async () => {
          try {
            const { apiService } = await import("@/utils/apiServices");
            return await apiService.user.getUserDetails();
          } catch (error) {
            // If user is not authenticated, return undefined instead of throwing
            if (
              error instanceof Error &&
              "status" in error &&
              (error as any).status === 401
            ) {
              return;
            }
            throw error;
          }
        },
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: false, // Don't retry auth queries to avoid infinite loops
      });
    }
  },
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
  validateSearch: (
    search: Record<string, unknown>,
  ): { limit: number; offset: number } => {
    return {
      limit: Number(search.limit) || 20,
      offset: Number(search.offset) || 0,
    };
  },
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: async ({ deps, context }) => {
    // Use queryClient.ensureQueryData for prefetching macro data
    const limit = deps.limit || 20;
    const offset = deps.offset || 0;

    const [macroTarget, macroHistory, weightGoals, weightLog] =
      await Promise.all([
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.macros.targets(),
          queryFn: async () => {
            const { apiService } = await import("@/utils/apiServices");
            const response = await apiService.macros.getMacroTarget();
            return response?.macroTarget;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
        }),
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.macros.history(Math.floor(offset / limit) + 1),
          queryFn: async () => {
            const { apiService } = await import("@/utils/apiServices");
            return await apiService.macros.getHistory(limit, offset);
          },
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        }),
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.goals.weight(),
          queryFn: async () => {
            const { apiService } = await import("@/utils/apiServices");
            return await apiService.goals.getWeightGoals();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        }),
        context.queryClient.ensureQueryData({
          queryKey: queryKeys.goals.weightLog(),
          queryFn: async () => {
            const { apiService } = await import("@/utils/apiServices");
            return await apiService.goals.getWeightLog();
          },
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        }),
      ]);

    // Transform weight goals data similar to the old loader
    let transformedWeightGoals;
    if (weightGoals) {
      const latestWeight =
        weightLog.length > 0
          ? weightLog.at(-1).weight
          : weightGoals.startingWeight;

      transformedWeightGoals = {
        ...weightGoals,
        currentWeight: latestWeight,
        targetWeight: weightGoals.targetWeight || weightGoals.startingWeight,
        weightGoal: (weightGoals.weightGoal || "maintain") as
          | "lose"
          | "maintain"
          | "gain",
        startDate:
          weightGoals.startDate || new Date().toISOString().split("T")[0],
        targetDate:
          weightGoals.targetDate || new Date().toISOString().split("T")[0],
        calorieTarget: weightGoals.calorieTarget || 2000,
        calculatedWeeks: weightGoals.calculatedWeeks || 1,
        weeklyChange: weightGoals.weeklyChange || 0,
        dailyChange: weightGoals.dailyChange || 0,
      };
    }

    return {
      macroTarget,
      history: macroHistory?.entries || [],
      historyHasMore: macroHistory?.hasMore || false,
      historyTotal: macroHistory?.total || 0,
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
  loader: async ({ context }) => {
    // Use queryClient.ensureQueryData for prefetching settings and billing data
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.settings.user(),
        queryFn: async () => {
          return await apiService.user.getUserDetails();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.settings.billing(),
        queryFn: async () => {
          return await apiService.billing.getBillingDetails();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      }),
    ]);
    // No need to return data since components will use query hooks
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
  loader: async ({ context }) => {
    // Use queryClient.ensureQueryData for prefetching goals and habits data
    const [macroTarget, weightGoals, weightLog] = await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.macros.targets(),
        queryFn: async () => {
          const { apiService } = await import("@/utils/apiServices");
          const response = await apiService.macros.getMacroTarget();
          return response?.macroTarget;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.goals.weight(),
        queryFn: async () => {
          const { apiService } = await import("@/utils/apiServices");
          return await apiService.goals.getWeightGoals();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      }),
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.goals.weightLog(),
        queryFn: async () => {
          const { apiService } = await import("@/utils/apiServices");
          return await apiService.goals.getWeightLog();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      }),
      // Prefetch habits data using TanStack Query
      context.queryClient.ensureQueryData({
        queryKey: queryKeys.habits.list(),
        queryFn: async () => {
          const { apiService } = await import("@/utils/apiServices");
          return await apiService.habits.getHabit();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      }),
    ]);

    // Transform weight goals data similar to the old loader
    let transformedWeightGoals;
    if (weightGoals) {
      const latestWeight =
        weightLog.length > 0
          ? weightLog.at(-1).weight
          : weightGoals.startingWeight;

      transformedWeightGoals = {
        ...weightGoals,
        currentWeight: latestWeight,
        targetWeight: weightGoals.targetWeight || weightGoals.startingWeight,
        weightGoal: (weightGoals.weightGoal || "maintain") as
          | "lose"
          | "maintain"
          | "gain",
        startDate:
          weightGoals.startDate || new Date().toISOString().split("T")[0],
        targetDate:
          weightGoals.targetDate || new Date().toISOString().split("T")[0],
        calorieTarget: weightGoals.calorieTarget || 2000,
        calculatedWeeks: weightGoals.calculatedWeeks || 1,
        weeklyChange: weightGoals.weeklyChange || 0,
        dailyChange: weightGoals.dailyChange || 0,
      };
    }

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
  validateSearch: (
    search: Record<string, unknown>,
  ): { startDate?: string; endDate?: string } => {
    return {
      startDate: search.startDate as string | undefined,
      endDate: search.endDate as string | undefined,
    };
  },
  loaderDeps: ({ search: { startDate, endDate } }) => ({ startDate, endDate }),
  loader: async ({ deps, context }) => {
    // Use queryClient.ensureQueryData for prefetching reporting data
    const today = new Date().toISOString().split("T")[0];
    const queryDate = deps.startDate || today;

    return await context.queryClient.ensureQueryData({
      queryKey: queryKeys.macros.dailyTotals(queryDate),
      queryFn: async () => {
        const { apiService } = await import("@/utils/apiServices");
        return await apiService.macros.getDailyTotals({
          startDate: deps.startDate,
          endDate: deps.endDate,
        });
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
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

const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  component: () => <LoadingStateDemoPage />,
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
  demoRoute,
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
