import { lazy } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequireCompleteProfile } from "./RequireCompleteProfile";

vi.mock("@/config/runtime", () => ({ isClerkAuthMode: true }));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: () => ({ isLoaded: true, isSignedIn: true }),
}));

const useUserMock = vi.fn();

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useUser: () => useUserMock(),
}));

// What the persisted cache holds before the launch refetch lands.
function persistedUnfinishedProfile({ isFetching }: { isFetching: boolean }) {
  useUserMock.mockReturnValue({
    data: { id: 1, isProfileComplete: false },
    isLoading: false,
    isFetching,
    isFetchedAfterMount: false,
  });
}

function renderAtHome() {
  const navigations: string[] = [];
  const rootRoute = createRootRoute();
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/home",
    component: () => (
      <RequireCompleteProfile>
        <p>Home</p>
      </RequireCompleteProfile>
    ),
  });
  // Lazy like the real page, so the old route stays on screen while it loads.
  const ProfileSetup = lazy(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));

    return { default: () => <p>Finish your setup</p> };
  });
  const profileSetupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile-setup",
    validateSearch: (search: Record<string, unknown>) => ({
      redirectTo: search.redirectTo as string | undefined,
    }),
    component: ProfileSetup,
  });
  const history = createMemoryHistory({ initialEntries: ["/home"] });
  // A looping guard would otherwise run until the worker is out of memory.
  history.block({
    blockerFn: ({ nextLocation }) => {
      navigations.push(nextLocation.href);

      return navigations.length > 10;
    },
    enableBeforeUnload: false,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, profileSetupRoute]),
    history,
  });
  render(<RouterProvider router={router} />);

  return { router, navigations };
}

describe("RequireCompleteProfile redirect", () => {
  it("sends an unfinished profile to setup once, remembering the guarded page", async () => {
    persistedUnfinishedProfile({ isFetching: false });
    const { router, navigations } = renderAtHome();

    expect(await screen.findByText("Finish your setup")).toBeInTheDocument();
    expect(router.state.location.href).toBe("/profile-setup?redirectTo=%2Fhome");
    expect(navigations).toEqual(["/profile-setup?redirectTo=%2Fhome"]);
  });

  it("waits for the refetch before trusting a persisted unfinished profile", async () => {
    persistedUnfinishedProfile({ isFetching: true });
    const { router, navigations } = renderAtHome();

    await waitFor(() => expect(router.state.status).toBe("idle"));
    expect(router.state.location.href).toBe("/home");
    expect(navigations).toEqual([]);
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });
});
