import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const TdeeCalculatorPage = lazy(
  () => import("@/features/landing/pages/TdeeCalculatorPage"),
);

export const Route = createFileRoute("/tools/tdee-calculator")({
  component: TdeeCalculatorRoute,
});

function TdeeCalculatorRoute() {
  return (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <TdeeCalculatorPage />
      </Suspense>
    </PublicSelfHostedGate>
  );
}
