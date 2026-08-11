import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const WeightLossCalculatorPage = lazy(
  () => import("@/features/landing/pages/WeightLossCalculatorPage"),
);

export const Route = createFileRoute("/tools/weight-loss-calculator")({
  component: WeightLossCalculatorRoute,
});

function WeightLossCalculatorRoute() {
  return (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <WeightLossCalculatorPage />
      </Suspense>
    </PublicSelfHostedGate>
  );
}
