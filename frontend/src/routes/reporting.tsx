import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/routes/-authGuards";
import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";

const ReportingPage = React.lazy(() => import("@/features/reporting/pages/ReportingPage"));

export const Route = createFileRoute("/reporting")({
  validateSearch: (search: Record<string, unknown>) => ({
    startDate: search.startDate as string | undefined,
    endDate: search.endDate as string | undefined,
  }),
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <ReportingPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});
