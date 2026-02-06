import { memo, ReactNode } from "react";

import { PageHeader } from "./PageHeader";

/**
 * FeaturePage (presentation-only)
 *
 * Intent:
 * - Lightweight wrapper that renders only the H1 title, optional subtitle,
 *   and optional header area (e.g., tabs or actions), followed by children.
 * - It MUST NOT introduce routing, providers, error boundaries, animations,
 *   dynamic keys, or any hook-based loading logic.
 * - Children are rendered directly to preserve identity across renders.
 *
 * Usage constraints:
 * - Do not pass new object/array literals as props on every render; memoize them in the page.
 * - Place app-wide containers/providers (e.g., DashboardPageContainer, Navbar,
 *   QueryErrorBoundary, ErrorBoundary) at the page or layout level, not here.
 */
export interface FeaturePageProps {
  title: string;
  subtitle?: string;
  headerChildren?: ReactNode;
  children: ReactNode;
}

function FeaturePageImpl({
  title,
  subtitle,
  headerChildren,
  children,
}: FeaturePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle}>
        {headerChildren}
      </PageHeader>
      {children}
    </div>
  );
}

// Memoized to avoid unnecessary re-renders when props are stable.
// This does not prevent children updates; it only guards the wrapper.
export const FeaturePage = memo(FeaturePageImpl);
export default FeaturePage;
