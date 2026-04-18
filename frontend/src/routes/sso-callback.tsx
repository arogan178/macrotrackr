import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const SSOCallbackPage = React.lazy(() => import("@/features/auth/pages/SsoCallbackPage"));

export const Route = createFileRoute("/sso-callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: search.redirectTo as string | undefined,
    flow: search.flow as string | undefined,
  }),
  component: SSOCallbackPage,
});
