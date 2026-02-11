export const formStyles = {
  // Label styles
  label: "block text-sm font-medium text-muted",
  labelBase: "block text-base font-medium text-foreground",
  labelLg: "block text-lg font-semibold text-foreground",
  labelXl: "block text-xl font-bold text-foreground",

  // Container spacing
  container: "space-y-2",

  // Input styles
  input: {
    base: "w-full px-3.5 py-2.5 bg-surface-2 border rounded-lg text-foreground placeholder:text-muted/50 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary/50 transition-colors duration-150",
    error: "border-error/60",
    normal: "border-border",
    withIcon: "pl-10",
    withUnit: "pr-10",
    withPassword: "pr-10",
    numberInput:
      "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
    disabled:
      "bg-surface/60 border-border/40 text-muted cursor-not-allowed opacity-50",
  },

  // Error and helper text
  error: "text-xs text-error font-medium",
  helper: "text-xs text-muted",
  maxLength: "text-xs text-muted",

  // Icon/unit containers
  iconContainer: "absolute left-3 top-1/2 -translate-y-1/2 text-muted",
  unitContainer: "absolute right-4 top-1/2 -translate-y-1/2 text-muted",

  // Select styles
  select: {
    container: "relative",
    base: "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat",
  },

  // Card container
  card: {
    container:
      "bg-surface rounded-xl border border-border overflow-hidden",
  },
};
