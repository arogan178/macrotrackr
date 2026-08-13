import { ReactNode } from "react";

import PageShell, { type PageWidth } from "@/components/layout/PageShell";

interface DashboardPageContainerProps {
  children: ReactNode;
  width?: PageWidth;
}

/**
 * The signed-in pages' entry point into `PageShell`. Kept as a named surface
 * because five pages compose against it; it owns no layout of its own.
 */
export function DashboardPageContainer({
  children,
  width = "app",
}: DashboardPageContainerProps) {
  return (
    <PageShell width={width} as="div">
      {children}
    </PageShell>
  );
}

export default DashboardPageContainer;
