import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireUnauth } from "@/routes/-authGuards";

const SignUpPage = React.lazy(() => import("@/features/auth/pages/SignUpPage"));

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo as string | undefined,
  }),
  component: () => (
    <RequireUnauth>
      <SignUpPage />
    </RequireUnauth>
  ),
});
