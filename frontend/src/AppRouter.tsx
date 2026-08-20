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
  // Without this the browser keeps the previous page's scroll offset across a
  // client navigation, so leaving a long page (/pricing, /blog) for a shorter
  // one dropped you into its footer — or past its content entirely while the
  // lazy sections were still resolving — which reads as a blank page.
  scrollRestoration: true,
  // `html { scroll-behavior: smooth }` makes the router's default `auto` scroll
  // animate, and the animation is aborted the moment the outgoing page unmounts
  // and the document shrinks — leaving the offset untouched. Jump instead.
  scrollRestorationBehavior: "instant",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
