/**
 * Shared visual language for the public calculators. These intentionally use
 * the same quiet, layered surfaces as the product UI while reserving the
 * brand green for live values and primary actions.
 */
export const calculatorCardClass =
  "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export const calculatorResultCardClass =
  "rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.08] via-surface to-surface p-5 sm:p-6";

export const calculatorEyebrowClass =
  "text-xs font-semibold uppercase tracking-wider text-muted";

export const calculatorSectionTitleClass =
  "text-xl font-bold tracking-tight text-foreground";

export const calculatorSectionDescriptionClass =
  "mt-1 text-sm leading-relaxed text-muted";

/** Result cards read as a label/value ledger; these keep every row aligned. */
export const calculatorStatRowClass =
  "flex items-baseline justify-between gap-3";

export const calculatorStatLabelClass = "text-muted";

export const calculatorStatValueClass =
  "font-semibold text-foreground tabular-nums";

/**
 * The result column follows the inputs on small screens, matching the order
 * people fill the calculator in, and moves to a sticky right rail on desktop.
 */
export const calculatorResultColumnClass =
  "lg:col-span-5 lg:sticky lg:top-24 lg:self-start";
