import React from "react";

import Heading from "@/components/ui/Heading";
import { cn } from "@/lib/classnameUtilities";

/**
 * One panel for the whole product — app pages, calculators and marketing.
 *
 * Depth comes from the four surface steps and two hairlines, never from a
 * shadow (nothing is darker than #000) and never from a box inside a box.
 * Sections within a panel are separated by dividers, which say "same group";
 * a border would say "different thing".
 */
export const PANEL_CLASS =
  "rounded-card border border-border bg-surface overflow-hidden";

export type PanelPadding = "none" | "compact" | "regular";

const PADDING: Record<PanelPadding, string> = {
  none: "",
  compact: "p-4",
  regular: "p-4 sm:p-6",
};

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing content in the header row: a filter, a link, a badge. */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: PanelPadding;
  /** `true` steps the panel one surface level, for a nested object. */
  raised?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({
  title,
  description,
  actions,
  footer,
  padding = "regular",
  raised = false,
  interactive = false,
  className,
  children,
  ...rest
}) => {
  const hasHeader = Boolean(title || description || actions);

  return (
    <div
      className={cn(
        PANEL_CLASS,
        raised && "bg-surface-2",
        interactive &&
          "group cursor-pointer transition-colors duration-200 hover:border-border-2",
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 border-b border-border",
            padding === "none" ? "p-4 sm:p-6" : PADDING[padding],
          )}
        >
          <div className="min-w-0">
            {title ? <Heading level="panel">{title}</Heading> : null}
            {description ? (
              <p className="mt-1 text-xs text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      )}

      {children ? <div className={PADDING[padding]}>{children}</div> : null}

      {footer ? (
        <div
          className={cn(
            "border-t border-border bg-surface-2",
            padding === "none" ? "p-4 sm:p-6" : PADDING[padding],
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
};

export default Panel;
