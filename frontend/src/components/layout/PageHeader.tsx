// PageHeader.tsx - shared header for Settings, Goals, Reporting and Home pages

import { ReactNode } from "react";

import Heading from "@/components/ui/Heading";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  hasChanges?: boolean;
  children?: ReactNode; // For tab navigation or badges
}

export const PageHeader = ({
  title,
  subtitle,
  hasChanges = false,
  children,
}: PageHeaderProps) => (
  <div className="pb-4 sm:border-b sm:border-border sm:pb-6">
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
      <div>
        <Heading level="page">{title}</Heading>
      </div>

      {/* Right Side: Badges and Tabs */}
      {(hasChanges || children) && (
        <div className="flex max-w-full shrink-0 items-center gap-2 max-sm:w-full sm:gap-3">
          {hasChanges && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning sm:px-3 sm:py-1">
              Unsaved Changes
            </span>
          )}
          {children}
        </div>
      )}
    </div>

    {/* A phone needs the line for data. Every subtitle is either a tagline or
        a date the page already shows. */}
    {subtitle && (
      <p className="mt-1.5 hidden max-w-2xl text-sm leading-relaxed text-muted sm:block">
        {subtitle}
      </p>
    )}
  </div>
);

export default PageHeader;
