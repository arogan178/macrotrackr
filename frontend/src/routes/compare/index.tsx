import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const ComparisonIndexPage = React.lazy(
  () => import("@/features/landing/pages/ComparisonIndexPage")
);

export const Route = createFileRoute("/compare/")({
  component: () => (
    <PublicSelfHostedGate>
      <ComparisonIndexPage />
    </PublicSelfHostedGate>
  ),
});
