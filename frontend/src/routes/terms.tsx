import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const TermsAndConditionsPage = React.lazy(() => import("@/features/landing/pages/TermsAndConditionsPage"));

export const Route = createFileRoute("/terms")({
  component: () => (
    <PublicSelfHostedGate>
      <TermsAndConditionsPage />
    </PublicSelfHostedGate>
  ),
});
