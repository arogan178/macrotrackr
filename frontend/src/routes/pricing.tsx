import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const PricingPage = React.lazy(() => import("@/features/billing/pages/PricingPage"));

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});
