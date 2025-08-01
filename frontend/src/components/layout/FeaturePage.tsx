import { AnimatePresence, motion } from "motion/react";
import { ReactNode } from "react";

import SettingsLoadingSkeleton from "@/features/settings/components/SettingsLoadingSkeleton";
import { FeatureType, useFeatureLoading } from "@/hooks/useFeatureLoading";

import ErrorBoundary from "../ui/ErrorBoundary";
import { QueryErrorBoundary } from "../ui/QueryErrorBoundary";
import { DashboardPageContainer } from "./DashboardPageContainer";
import Navbar from "./Navbar";
import { PageHeader } from "./PageHeader";

/**
 * FeaturePage layout component.
 * - Wraps content in DashboardPageContainer, Navbar, PageHeader, error boundaries, and animation.
 * - Accepts title, subtitle, feature, and children.
 */
interface FeaturePageProps {
  title: string;
  subtitle?: string;
  headerChildren?: ReactNode;
  children: ReactNode;
  feature?: FeatureType;
  loadingSkeleton?: ReactNode;
}

function FeaturePageBase({
  title,
  subtitle,
  headerChildren,
  children,
  isLoading,
  loadingSkeleton,
}: Omit<FeaturePageProps, "feature"> & { isLoading: boolean }) {
  return (
    <DashboardPageContainer>
      <Navbar />
      <QueryErrorBoundary>
        <ErrorBoundary>
          <PageHeader title={title} subtitle={subtitle}>
            {headerChildren}
          </PageHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key="feature-page-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {isLoading
                ? (loadingSkeleton ?? <SettingsLoadingSkeleton />)
                : children}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </QueryErrorBoundary>
    </DashboardPageContainer>
  );
}

export function FeaturePage({
  title,
  subtitle,
  headerChildren,
  children,
  feature,
  loadingSkeleton,
}: FeaturePageProps) {
  if (!feature) {
    return (
      <FeaturePageBase
        title={title}
        subtitle={subtitle}
        headerChildren={headerChildren}
        loadingSkeleton={loadingSkeleton}
        isLoading={false}
      >
        {children}
      </FeaturePageBase>
    );
  }

  // Wrapper component to keep hooks order stable
  function FeaturePageWithFeature() {
    const loading = useFeatureLoading(feature);
    const isLoading = loading.isLoading;
    return (
      <FeaturePageBase
        title={title}
        subtitle={subtitle}
        headerChildren={headerChildren}
        loadingSkeleton={loadingSkeleton}
        isLoading={isLoading}
      >
        {children}
      </FeaturePageBase>
    );
  }

  return <FeaturePageWithFeature />;
}

export default FeaturePage;
