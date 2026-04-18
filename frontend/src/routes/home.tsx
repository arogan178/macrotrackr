import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireAuth } from "@/routes/-authGuards";
import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";

const HomePage = React.lazy(() => import("@/features/macroTracking/pages/HomePage"));

export const Route = createFileRoute("/home")({
  component: () => (
    <RequireAuth>
      <RequireCompleteProfile>
        <HomePage />
      </RequireCompleteProfile>
    </RequireAuth>
  ),
});
