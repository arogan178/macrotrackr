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
  <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
    {/* Left Side: Title and subtitle */}
    <div className="mb-6">
      <h1 className="bg-clip-text text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {subtitle && <p className="max-w-2xl text-foreground">{subtitle}</p>}
    </div>
    {/* Right Side: Badges and Tabs */}
    <div className="flex items-center gap-3">
      {/* Badges */}
      <div className="flex space-x-2">
        {hasChanges && (
          <span className="rounded-full border border-warning/30 bg-warning/20 px-3 py-1 text-sm font-medium text-warning">
            Unsaved Changes
          </span>
        )}
      </div>
      {/* Render Tabs or other children */}
      {children}
    </div>
  </div>
);

export default PageHeader;
