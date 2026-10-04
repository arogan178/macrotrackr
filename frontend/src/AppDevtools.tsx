import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { router } from "./AppRouter";

export function AppDevtools() {
  return (
    <TanStackDevtools
      plugins={[
        { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel router={router} />,
        },
      ]}
    />
  );
}
