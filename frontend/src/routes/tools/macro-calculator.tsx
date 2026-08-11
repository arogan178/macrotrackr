import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const MacroCalculatorPage = lazy(
  () => import("@/features/landing/pages/MacroCalculatorPage"),
);

export const Route = createFileRoute("/tools/macro-calculator")({
  component: MacroCalculatorRoute,
});

function MacroCalculatorRoute() {
  return (
    <PublicSelfHostedGate>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <MacroCalculatorPage />
      </Suspense>
    </PublicSelfHostedGate>
  );
}
