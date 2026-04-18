import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const PrivacyPolicyPage = React.lazy(() => import("@/features/landing/pages/PrivacyPolicyPage"));

export const Route = createFileRoute("/privacy")({
  component: PrivacyPolicyPage,
});
