import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const MigrationGuidePage = lazy(
  () => import("@/features/landing/pages/MigrationGuidePage"),
);

export const Route = createFileRoute("/migrate/$slug")({
  component: () => (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner />}>
        <MigrationGuidePage />
      </Suspense>
    </PublicSelfHostedGate>
  ),
});
