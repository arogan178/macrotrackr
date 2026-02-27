// PageHeader.tsx - shared header for Settings, Goals, Reporting and Home pages

import { ReactNode } from "react";

import TextGenerateEffect from "@/components/animation/TextGenerateEffect";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  hasChanges?: boolean;
  children?: ReactNode; // For tab navigation or badges
  /** Enable animated text reveal effect for the title */
  animateTitle?: boolean;
}

export const PageHeader = ({
  title,
  subtitle,
  hasChanges = false,
  children,
  animateTitle = false,
}: PageHeaderProps) => (
  <div className="flex flex-col items-start justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center">
    {/* Left Side: Title and subtitle */}
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {animateTitle ? (
          <TextGenerateEffect
            text={title}
            mode="word"
            speed={0.1}
            duration={0.5}
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          />
        ) : (
          title
        )}
      </h1>
      {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
    </div>
    {/* Right Side: Badges and Tabs */}
    <div className="flex items-center gap-3">
      {/* Badges */}
      <div className="flex space-x-2">
        {hasChanges && (
          <span className="rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-sm font-medium text-warning">
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
