import { PANEL_CLASS } from "@/components/ui/Panel";

export const formStyles = {
  // Label styles
  label: "block text-xs sm:text-sm font-medium text-muted",
  labelBase: "block text-sm sm:text-base font-medium text-foreground",
  labelLg: "block text-base sm:text-lg font-semibold text-foreground",
  labelXl: "block text-lg sm:text-xl font-bold text-foreground",

  // Container spacing
  container: "space-y-2",

  // Input styles
  input: {
    base: "w-full px-3 sm:px-3.5 py-2 sm:py-2.5 bg-surface-2 border rounded-control text-xs sm:text-sm text-foreground placeholder:text-xs sm:placeholder:text-sm placeholder:text-muted/70 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary transition-colors duration-200",
    error: "border-error",
    normal: "border-border hover:border-border-2",
    withIcon: "pl-9 sm:pl-10",
    withUnit: "pr-9 sm:pr-10",
    withPassword: "pr-9 sm:pr-10",
    numberInput:
      "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
    disabled:
      "bg-surface border-border text-muted cursor-not-allowed opacity-50",
  },

  // Error and helper text
  error: "text-xs text-error font-medium",
  helper: "text-xs text-muted",
  maxLength: "text-xs text-muted",

  // Icon/unit containers
  iconContainer: "absolute left-3 top-1/2 -translate-y-1/2 text-muted",
  unitContainer: "absolute right-4 top-1/2 -translate-y-1/2 text-muted",

  // Select styles
  // The chevron is a real element, not a background image. It was a data URI
  // whose xmlns read `http://www.w3.org/svg` — a namespace that does not exist.
  // Chrome renders it anyway, Firefox refuses, so every select lost its arrow
  // there. It also hardcoded a grey rather than taking the muted token.
  select: {
    container: "relative",
    base: "appearance-none pr-10",
  },

  // Card container — the shared panel, so a form card and a page panel are
  // literally the same object.
  card: {
    container: PANEL_CLASS,
  },
};
