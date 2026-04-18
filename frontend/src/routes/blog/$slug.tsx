import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const BlogArticlePage = React.lazy(() => import("@/features/landing/pages/BlogArticlePage"));

export const Route = createFileRoute("/blog/$slug")({
  component: BlogArticlePage,
});
