import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const BmrCalculatorPage = lazy(
  () => import("@/features/landing/pages/BmrCalculatorPage"),
);

export const Route = createFileRoute("/tools/bmr-calculator")({
  component: BmrCalculatorRoute,
});

function BmrCalculatorRoute() {
  return (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <BmrCalculatorPage />
      </Suspense>
    </PublicSelfHostedGate>
  );
}
