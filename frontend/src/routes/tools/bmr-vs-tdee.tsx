import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const BmrVsTdeePage = React.lazy(() => import("@/features/landing/pages/BmrVsTdeePage"));

export const Route = createFileRoute("/tools/bmr-vs-tdee")({
  component: () => (
    <PublicSelfHostedGate>
      <BmrVsTdeePage />
    </PublicSelfHostedGate>
  ),
});
