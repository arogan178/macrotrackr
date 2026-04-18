import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const LandingPage = React.lazy(() => import("@/features/landing/pages/LandingPage"));

export const Route = createFileRoute("/")({
  component: LandingPage,
});
