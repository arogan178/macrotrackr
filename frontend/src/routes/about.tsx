import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const AboutPage = React.lazy(() => import("@/features/landing/pages/AboutPage"));

export const Route = createFileRoute("/about")({
  component: () => (
    <PublicSelfHostedGate>
      <AboutPage />
    </PublicSelfHostedGate>
  ),
});
