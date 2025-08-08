import { ReactNode } from "react";

interface DashboardPageContainerProps {
  children: ReactNode;
}

export function DashboardPageContainer({
  children,
}: DashboardPageContainerProps) {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Soft radial spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-surface)_0%,transparent_70%)] opacity-60" />

      {/* Subtle grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

      {/* Noise texture */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />

      {/* Page content */}
      <div className="relative mx-auto max-w-7xl px-4 py-0 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default DashboardPageContainer;
