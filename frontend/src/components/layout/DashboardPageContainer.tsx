import PageBackground from "@/features/landing/components/PageBackground";

interface DashboardPageContainerProps {
  children: ReactNode;
}

export function DashboardPageContainer({
  children,
}: DashboardPageContainerProps) {
  return (
    <div className="relative min-h-screen text-foreground">
      <PageBackground />
      {/* Page content */}
      <div className="relative mx-auto max-w-7xl px-4 py-0 pb-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export default DashboardPageContainer;
