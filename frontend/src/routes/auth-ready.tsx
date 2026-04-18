import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const AuthReadyPage = React.lazy(() => import("@/features/auth/pages/AuthReadyPage"));

export const Route = createFileRoute("/auth-ready")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: search.redirectTo as string | undefined,
  }),
  component: AuthReadyPage,
});
