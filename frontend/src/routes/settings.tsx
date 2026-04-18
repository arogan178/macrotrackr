import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";
import { RequireAuth } from "@/routes/-authGuards";

const SettingsPage = React.lazy(() => import("@/features/settings/pages/SettingsPage"));

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab as string | undefined,
  }),
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <SettingsPage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});
