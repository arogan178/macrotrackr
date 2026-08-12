// PageHeader.tsx - shared header for Settings, Goals, Reporting and Home pages

import { ReactNode } from "react";

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
  <div className="border-b border-border/40 pb-3 sm:pb-6">
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
      </div>

      {/* Right Side: Badges and Tabs */}
      {(hasChanges || children) && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {hasChanges && (
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning sm:px-3 sm:py-1 sm:text-sm">
              Unsaved Changes
            </span>
          )}
          {children}
        </div>
      )}
    </div>

    {/* Subtitle */}
    {subtitle && (
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted sm:mt-1.5 sm:text-base">
        {subtitle}
      </p>
    )}
  </div>
);

export default PageHeader;
