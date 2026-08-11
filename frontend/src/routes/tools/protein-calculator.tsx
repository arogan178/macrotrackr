import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const ProteinCalculatorPage = lazy(
  () => import("@/features/landing/pages/ProteinCalculatorPage"),
);

export const Route = createFileRoute("/tools/protein-calculator")({
  component: ProteinCalculatorRoute,
});

function ProteinCalculatorRoute() {
  return (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <ProteinCalculatorPage />
      </Suspense>
    </PublicSelfHostedGate>
  );
}
