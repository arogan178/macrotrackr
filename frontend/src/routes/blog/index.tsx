import React from "react";
import { createFileRoute } from "@tanstack/react-router";

const BlogIndexPage = React.lazy(() => import("@/features/landing/pages/BlogIndexPage"));

export const Route = createFileRoute("/blog/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: search.category as string | undefined,
    tag: search.tag as string | undefined,
    q: search.q as string | undefined,
  }),
  component: BlogIndexPage,
});
