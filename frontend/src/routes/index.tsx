import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";
import { RedirectSignedInToApp } from "@/routes/-RedirectSignedInToApp";

const LandingPage = React.lazy(() => import("@/features/landing/pages/LandingPage"));

export const Route = createFileRoute("/")({
  component: () => (
    <PublicSelfHostedGate>
      <RedirectSignedInToApp>
        <LandingPage />
      </RedirectSignedInToApp>
    </PublicSelfHostedGate>
  ),
});
