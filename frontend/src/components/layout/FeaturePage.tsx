import { memo, ReactNode } from "react";

import { PageHeader } from "./PageHeader";

export interface FeaturePageProps {
  title: string;
  subtitle?: string;
  headerChildren?: ReactNode;
  /** Replaces the header below md, for a page whose phone header is its own. */
  mobileHeader?: ReactNode;
  children: ReactNode;
}

function FeaturePageImpl({
  title,
  subtitle,
  headerChildren,
  mobileHeader,
  children,
}: FeaturePageProps) {
  return (
    <div className="space-y-3.5 sm:space-y-6">
      {mobileHeader ? <div className="md:hidden">{mobileHeader}</div> : null}
      <div className={mobileHeader ? "hidden md:block" : undefined}>
        <PageHeader title={title} subtitle={subtitle}>
          {headerChildren}
        </PageHeader>
      </div>
      {children}
    </div>
  );
}

export const FeaturePage = memo(FeaturePageImpl);
export default FeaturePage;
