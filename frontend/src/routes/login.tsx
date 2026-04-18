import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireUnauth } from "@/routes/-authGuards";

const SignInPage = React.lazy(() => import("@/features/auth/pages/SignInPage"));

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo as string | undefined,
  }),
  component: () => (
    <RequireUnauth>
      <SignInPage />
    </RequireUnauth>
  ),
});
