// src/components/layout/DashboardPageContainer.tsx

import { ReactNode } from "react";

interface DashboardPageContainerProps {
  children: ReactNode;
}

export function DashboardPageContainer({
  children,
}: DashboardPageContainerProps) {
  return (
    // This is the line that sets the background for your main pages.
    // It should only have `bg-surface`.
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 relative">
        {children}
      </div>
    </div>
  );
}

export default DashboardPageContainer;
