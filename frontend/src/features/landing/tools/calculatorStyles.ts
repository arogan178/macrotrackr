import { TYPE_SCALE } from "@/components/ui/Heading";
import { PANEL_CLASS } from "@/components/ui/Panel";

/**
 * Shared visual language for the public calculators. These intentionally use
 * the same quiet, layered surfaces as the product UI while reserving the
 * brand green for live values and primary actions.
 */
export const calculatorCardClass = `${PANEL_CLASS} p-4 sm:p-6`;

/** The one place a panel is allowed to lean on the brand colour: the answer. */
export const calculatorResultCardClass =
  "rounded-card border border-primary/30 bg-surface-2 p-4 sm:p-6";

export const calculatorEyebrowClass = `${TYPE_SCALE.micro} text-muted`;

export const calculatorSectionTitleClass = `${TYPE_SCALE.page} text-foreground`;

export const calculatorSectionDescriptionClass = `mt-1 ${TYPE_SCALE.body} leading-relaxed text-muted`;

/** Result cards read as a label/value ledger; these keep every row aligned. */
export const calculatorStatRowClass =
  "flex items-baseline justify-between gap-3";

export const calculatorStatLabelClass = "text-muted";

export const calculatorStatValueClass =
  "font-semibold text-foreground tabular-nums";

/**
 * The result column follows the inputs on small screens, matching the order
 * people fill the calculator in, and moves to a sticky right rail from md.
 * Below md it docks to the bottom of the viewport instead: the answer used to
 * scroll away behind the keyboard while the inputs were still being typed.
 */
export const calculatorResultColumnClass =
  "sticky bottom-[var(--sab)] z-20 md:col-span-5 md:bottom-auto md:top-[var(--header-offset)] md:self-start";
