import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const LandingPage = React.lazy(() => import("@/features/landing/pages/LandingPage"));

export const Route = createFileRoute("/")({
  component: () => (
    <PublicSelfHostedGate>
      <LandingPage />
    </PublicSelfHostedGate>
  ),
});
