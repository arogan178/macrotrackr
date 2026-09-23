import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";
import { RequireAuth } from "@/routes/-authGuards";

const ReportingPage = React.lazy(() => import("@/features/reporting/pages/ReportingPage"));

export const Route = createFileRoute("/reporting")({
  validateSearch: (search: Record<string, unknown>) => ({
    range: search.range as string | undefined,
  }),
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <ReportingPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});
