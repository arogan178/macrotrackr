import React from "react";

import { cn } from "@/lib/classnameUtilities";

/**
 * Three layout intents, so pages stop inventing their own `max-w-*`:
 * - `app`     the signed-in surfaces and marketing sections (7xl)
 * - `content` a single column of panels or a form (5xl)
 * - `prose`   long-form reading: blog articles, legal copy (3xl)
 */
export type PageWidth = "app" | "content" | "prose" | "full";

const WIDTHS: Record<PageWidth, string> = {
  app: "max-w-7xl",
  content: "max-w-5xl",
  prose: "max-w-3xl",
  full: "",
};

interface PageShellProps {
  children: React.ReactNode;
  width?: PageWidth;
  /**
   * `true` for any page rendered under a fixed AppHeader. The offset is owned
   * here — pages no longer hardcode pt-24/pt-28/pt-32/pt-40 against a header
   * whose height they cannot see.
   */
  offsetHeader?: boolean;
  /** Vertical rhythm below the content, before the safe area. */
  className?: string;
  as?: "main" | "div";
  id?: string;
}

const PageShell: React.FC<PageShellProps> = ({
  children,
  width = "app",
  offsetHeader = true,
  className,
  as: Element = "main",
  id,
}) => (
  <div className="relative min-h-dvh text-foreground">
    <Element
      id={id}
      className={cn(
        "relative z-10 mx-auto w-full px-4 sm:px-6 lg:px-8",
        WIDTHS[width],
        offsetHeader ? "pt-[var(--header-offset)]" : "pt-4 sm:pt-6",
        "pb-[var(--page-shell-pb)]",
        className,
      )}
    >
      {children}
    </Element>
  </div>
);

export default PageShell;
