import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const DeleteAccountPage = React.lazy(
  () => import("@/features/landing/pages/DeleteAccountPage"),
);

export const Route = createFileRoute("/delete-account")({
  component: () => (
    <PublicSelfHostedGate>
      <DeleteAccountPage />
    </PublicSelfHostedGate>
  ),
});
