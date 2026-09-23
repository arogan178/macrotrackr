import React from "react";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";

import { queryClient } from "./lib/queryClient";
import { createAppRouter } from "./AppRouter";

// Local auth redirects every public page to /login, so there is nothing to
// prerender. Exported from the bundle because only Vite sees the .env files.
export { isClerkAuthMode as rendersPublicPages } from "./config/runtime";

/**
 * Renders a public route at build time for `scripts/prerender.mjs`.
 *
 * The tree mirrors `main.tsx` for a signed-out visitor. The providers there
 * render no markup, but the three child slots of `AppContent` feed `useId`, so
 * the router has to sit in the same slot for the ids to match on hydration.
 */
export async function render(pathname: string): Promise<string> {
  const router = createAppRouter(
    createMemoryHistory({ initialEntries: [pathname] }),
  );
  await router.load();

  const tree = (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        {null}
        <RouterProvider router={router} />
        {null}
      </QueryClientProvider>
    </React.StrictMode>
  );

  // The first pass only resolves every React.lazy in the tree. Its own output
  // streams large boundaries out of order through inline scripts, which the CSP
  // blocks, so the markup comes from a synchronous second pass instead.
  await new Promise<void>((resolve, reject) => {
    const { abort } = renderToPipeableStream(tree, {
      onAllReady: () => {
        abort();
        resolve();
      },
      onShellError: reject,
    });
  });

  // TanStack's scroll-restoration script removes itself before hydration. The
  // CSP would stop it running, leaving a node the client does not render.
  return renderToString(tree).replaceAll(
    /<script>(?:(?!<\/script>)[\S\s])*document\.currentScript\.remove\(\)<\/script>/g,
    "",
  );
}
