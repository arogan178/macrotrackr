import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/routes/-authGuards";
import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";

const GoalsPage = React.lazy(() => import("@/features/goals/pages/GoalsPage"));

export const Route = createFileRoute("/goals")({
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <GoalsPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});
