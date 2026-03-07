import { ReactNode } from "react";

import PageBackground from "@/components/layout/PageBackground";

interface DashboardPageContainerProps {
  children: ReactNode;
}

export function DashboardPageContainer({
  children,
}: DashboardPageContainerProps) {
  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <PageBackground />
      </div>
      {/* Page content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default DashboardPageContainer;
