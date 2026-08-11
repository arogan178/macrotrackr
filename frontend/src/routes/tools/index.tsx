import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const ToolsHubPage = lazy(
  () => import("@/features/landing/pages/ToolsHubPage"),
);

export const Route = createFileRoute("/tools/")({
  component: ToolsHubRoute,
});

function ToolsHubRoute() {
  return (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <ToolsHubPage />
      </Suspense>
    </PublicSelfHostedGate>
  );
}
