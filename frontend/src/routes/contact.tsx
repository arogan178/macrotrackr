import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const ContactPage = React.lazy(() => import("@/features/landing/pages/ContactPage"));

export const Route = createFileRoute("/contact")({
  component: () => (
    <PublicSelfHostedGate>
      <ContactPage />
    </PublicSelfHostedGate>
  ),
});
