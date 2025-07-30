// Centralized form and UI styles for consistency across components
// Font sizes and weights are based on usage in src/components/
export const formStyles = {
  // Label styles
  label: "block text-sm font-medium text-foreground", // Common: text-sm, font-medium
  labelBase: "block text-base font-medium text-foreground", // For larger forms
  labelLg: "block text-lg font-semibold text-foreground", // For headings
  labelXl: "block text-xl font-bold text-foreground", // For prominent titles

  // Container spacing
  container: "space-y-2",

  // Input styles
  input: {
    base: `w-full px-4 py-2 bg-surface/70 border-2 rounded-lg text-foreground 
           focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none
           transition-all duration-200 shadow-surface`,
    error: "border-red-500/70",
    normal: "border-border/70",
    withIcon: "pl-10",
    withUnit: "pr-10",
    withPassword: "pr-10",
    numberInput: `[&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                  [-moz-appearance:textfield]`,
    disabled:
      "bg-surface/40 border-border/50 text-foreground cursor-not-allowed opacity-70",
  },

  // Error and helper text
  error: "text-xs text-vibrant-accent font-medium", // text-xs, font-medium
  helper: "text-xs text-foreground",
  maxLength: "text-xs text-foreground",

  // Icon/unit containers
  iconContainer: "absolute left-3 top-1/2 -translate-y-1/2 text-foreground",
  unitContainer: "absolute right-4 top-1/2 -translate-y-1/2 text-foreground",

  // Select styles
  select: {
    container: "relative",
    base: `appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat`,
  },

  // Button styles
  button: {
    // Base button styles (used in Button and elsewhere)
    base:
      "inline-flex items-center justify-center font-medium text-sm gap-1.5 transition-all duration-200 " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
      "rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
    // Size styles should be handled by FORM_BUTTON_SIZES or similar
    // Variant styles
    variants: {
      primary:
        "bg-primary hover:bg-opacity-90 disabled:hover:bg-accent text-foreground focus:ring-accent shadow-surface",
      secondary:
        "bg-secondary hover:bg-opacity-90 disabled:hover:bg-secondary text-foreground focus:ring-secondary shadow-surface",
      danger:
        "bg-error hover:bg-opacity-90 disabled:hover:bg-error text-foreground focus:ring-error shadow-surface",
      success:
        "bg-success hover:bg-opacity-90 disabled:hover:bg-success text-foreground focus:ring-success shadow-surface",
      ghost:
        "bg-transparent hover:bg-surface/50 disabled:hover:bg-transparent disabled:hover:text-foreground",
    },
    // Full width utility
    fullWidth: "w-full",
    // For strong CTAs
    baseBold: "py-3 rounded-lg font-bold flex items-center justify-center",
    // For secondary CTAs
    baseSemibold:
      "py-3 rounded-lg font-semibold flex items-center justify-center",
    // Common disabled/transition
    common: "disabled:opacity-50 transition-all duration-300 transform",
  },

  // Tab styles
  tab: {
    base: "py-3 px-6 font-medium text-sm focus:outline-none",
    baseLg: "py-3 px-6 font-semibold text-lg focus:outline-none", // For larger tabs
    active: "text-primary border-b-2 border-primary",
    inactive: "text-foreground hover:text-foreground",
  },

  // Card container
  card: {
    container:
      "bg-surface/70 backdrop-blur-sm rounded-2xl border border-border/50 shadow-modal overflow-hidden",
  },
};
