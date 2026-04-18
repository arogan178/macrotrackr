import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const TermsAndConditionsPage = React.lazy(() => import("@/features/landing/pages/TermsAndConditionsPage"));

export const Route = createFileRoute("/terms")({
  component: TermsAndConditionsPage,
});
