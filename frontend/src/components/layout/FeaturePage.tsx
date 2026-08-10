import { memo, ReactNode } from "react";

import { PageHeader } from "./PageHeader";

export interface FeaturePageProps {
  title: string;
  subtitle?: string;
  headerChildren?: ReactNode;
  children: ReactNode;
  animateTitle?: boolean;
}

function FeaturePageImpl({
  title,
  subtitle,
  headerChildren,
  children,
  animateTitle = true,
}: FeaturePageProps) {
  return (
    <div className="space-y-3.5 sm:space-y-6">
      <PageHeader title={title} subtitle={subtitle} animateTitle={animateTitle}>
        {headerChildren}
      </PageHeader>
      {children}
    </div>
  );
}

export const FeaturePage = memo(FeaturePageImpl);
export default FeaturePage;
