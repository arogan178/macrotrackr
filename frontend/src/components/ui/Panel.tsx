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
 *
 * The dividers are graded, and the grade is information. A nutrition panel
 * separates its major blocks with a heavy rule and its sub-rows with a
 * hairline, so you can see the structure before you have read a word of it.
 * Here: `RULE_SECTION` (2px, strong hairline) divides a panel from its header
 * and footer; `RULE_HAIRLINE` (1px, resting) divides rows inside the body.
 * Two weights, and the heavier one always means the larger division.
 */
export const RULE_SECTION = "border-border-2";
export const RULE_HAIRLINE = "border-border";
export const PANEL_CLASS =
  "rounded-card border border-border bg-surface overflow-hidden";

export type PanelPadding = "none" | "compact" | "regular";

/**
 * Below md a flat panel drops its box and sits on the page, the way a phone
 * reads best: sections separated by space, not borders, with the page margin
 * as their only inset.
 */
export const FLAT_ON_PHONE =
  "max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent";
const FLAT_INSET = "max-md:px-0";

const PADDING: Record<PanelPadding, string> = {
  none: "",
  compact: "p-4",
  regular: "p-4 sm:p-6",
};

interface PanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Rendered as the panel heading, so it takes a node rather than the string
   *  the DOM `title` attribute would allow. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing content in the header row: a filter, a link, a badge. */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: PanelPadding;
  /** `true` steps the panel one surface level, for a nested object. */
  raised?: boolean;
  /** Below md, no box: the panel's content sits straight on the page. */
  flatOnPhone?: boolean;
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
  flatOnPhone = false,
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
        flatOnPhone && FLAT_ON_PHONE,
        interactive &&
          "group cursor-pointer transition-colors duration-200 hover:border-border-2",
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 border-b-2",
            RULE_SECTION,
            padding === "none" ? "p-4 sm:p-6" : PADDING[padding],
            flatOnPhone && "max-md:border-b-0 max-md:px-0 max-md:pt-0",
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

      {children ? (
        <div className={cn("flex-1", PADDING[padding], flatOnPhone && FLAT_INSET)}>{children}</div>
      ) : null}

      {footer ? (
        <div
          className={cn(
            "border-t-2 bg-surface-2",
            RULE_SECTION,
            padding === "none" ? "p-4 sm:p-6" : PADDING[padding],
            // Flat, the footer is the one filled surface left: an aside.
            flatOnPhone && "max-md:rounded-card max-md:border-t-0",
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
};

export default Panel;
