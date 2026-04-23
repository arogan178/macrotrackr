import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const PricingPage = React.lazy(() => import("@/features/billing/pages/PricingPage"));

export const Route = createFileRoute("/pricing")({
  component: () => (
    <PublicSelfHostedGate>
      <PricingPage />
    </PublicSelfHostedGate>
  ),
});
