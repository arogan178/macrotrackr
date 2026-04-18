import { createRouter, RouterProvider } from "@tanstack/react-router";

import { queryClient } from "./lib/queryClient";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  queryClient: typeof queryClient;
}

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
