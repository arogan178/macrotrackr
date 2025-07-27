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
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
    {/* Left Side: Title and subtitle */}
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="text-gray-400 max-w-2xl">{subtitle}</p>}
    </div>
    {/* Right Side: Badges and Tabs */}
    <div className="flex items-center gap-3">
      {/* Badges */}
      <div className="flex space-x-2">
        {hasChanges && (
          <span className="px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-full text-yellow-300 text-sm font-medium">
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
