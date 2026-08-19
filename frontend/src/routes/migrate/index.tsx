import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const MigrationIndexPage = lazy(
  () => import("@/features/landing/pages/MigrationIndexPage"),
);

export const Route = createFileRoute("/migrate/")({
  component: () => (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner />}>
        <MigrationIndexPage />
      </Suspense>
    </PublicSelfHostedGate>
  ),
});
