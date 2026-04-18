import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const ProfileSetupPage = React.lazy(() => import("@/features/auth/pages/ProfileSetupPage"));

export const Route = createFileRoute("/profile-setup")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: search.redirectTo as string | undefined,
  }),
  component: ProfileSetupPage,
});
