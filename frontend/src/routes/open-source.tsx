import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const OpenSourcePage = React.lazy(() => import("@/features/landing/pages/OpenSourcePage"));

export const Route = createFileRoute("/open-source")({
  component: () => (
    <PublicSelfHostedGate>
      <OpenSourcePage />
    </PublicSelfHostedGate>
  ),
});
