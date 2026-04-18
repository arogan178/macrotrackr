import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { RequireCompleteProfile } from "@/components/auth/RequireCompleteProfile";
import { RequireAuth } from "@/routes/-authGuards";

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
