import { AnimatePresence, motion } from "motion/react";
import { ReactNode } from "react";

import ErrorBoundary from "../ui/ErrorBoundary";
import { QueryErrorBoundary } from "../ui/QueryErrorBoundary";
import { DashboardPageContainer } from "./DashboardPageContainer";
import Navbar from "./Navbar";
import { PageHeader } from "./PageHeader";

/**
 * FeaturePage layout component.
 * - Wraps content in DashboardPageContainer, Navbar, PageHeader, error boundaries, and animation.
 * - Accepts title, subtitle, and children.
 */
interface FeaturePageProps {
  title: string;
  subtitle?: string;
  headerChildren?: ReactNode;
  children: ReactNode;
}

export function FeaturePage({
  title,
  subtitle,
  headerChildren,
  children,
}: FeaturePageProps) {
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
              {children}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </QueryErrorBoundary>
    </DashboardPageContainer>
  );
}

export default FeaturePage;
