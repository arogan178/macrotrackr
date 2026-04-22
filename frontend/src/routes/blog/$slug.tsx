import React from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

const BlogArticlePage = React.lazy(() => import("@/features/landing/pages/BlogArticlePage"));

export const Route = createFileRoute("/blog/$slug")({
  component: () => (
    <PublicSelfHostedGate>
      <BlogArticlePage />
    </PublicSelfHostedGate>
  ),
});
