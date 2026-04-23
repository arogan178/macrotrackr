import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const PrivacyPolicyPage = React.lazy(() => import("@/features/landing/pages/PrivacyPolicyPage"));

export const Route = createFileRoute("/privacy")({
  component: () => (
    <PublicSelfHostedGate>
      <PrivacyPolicyPage />
    </PublicSelfHostedGate>
  ),
});
