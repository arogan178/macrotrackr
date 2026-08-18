import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const ComparisonArticlePage = React.lazy(
  () => import("@/features/landing/pages/ComparisonArticlePage")
);

export const Route = createFileRoute("/compare/$slug")({
  component: () => (
    <PublicSelfHostedGate>
      <ComparisonArticlePage />
    </PublicSelfHostedGate>
  ),
});
