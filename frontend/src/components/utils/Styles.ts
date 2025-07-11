// Centralized form and UI styles for consistency across components
// Font sizes and weights are based on usage in src/components/
export const formStyles = {
  // Label styles
  label: "block text-sm font-medium text-gray-300", // Common: text-sm, font-medium
  labelBase: "block text-base font-medium text-gray-300", // For larger forms
  labelLg: "block text-lg font-semibold text-gray-200", // For headings
  labelXl: "block text-xl font-bold text-gray-100", // For prominent titles

  // Container spacing
  container: "space-y-2",

  // Input styles
  input: {
    base: `w-full px-4 py-2 bg-gray-700/70 border-2 rounded-lg text-gray-100 
           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
           transition-all duration-200 shadow-sm`,
    error: "border-red-500/70",
    normal: "border-gray-600/70",
    withIcon: "pl-10",
    withUnit: "pr-10",
    withPassword: "pr-10",
    numberInput: `[&::-webkit-inner-spin-button]:appearance-none
                  [&::-webkit-outer-spin-button]:appearance-none
                  [-moz-appearance:textfield]`,
    disabled:
      "bg-gray-600/40 border-gray-500/50 text-gray-400 cursor-not-allowed opacity-70",
  },

  // Error and helper text
  error: "text-xs text-red-400 font-medium", // text-xs, font-medium
  helper: "text-xs text-gray-500",
  maxLength: "text-xs text-gray-500",

  // Icon/unit containers
  iconContainer: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",
  unitContainer: "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400",

  // Select styles
  select: {
    container: "relative",
    base: `appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                bg-[length:2rem] bg-[right_0.75rem_center] bg-no-repeat`,
  },

  // Button styles
  button: {
    // Base button styles (used in FormButton and elsewhere)
    base:
      "inline-flex items-center justify-center font-medium text-sm gap-1.5 transition-all duration-200 " +
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 " +
      "rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
    // Size styles should be handled by FORM_BUTTON_SIZES or similar
    // Variant styles
    variants: {
      primary:
        "bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white focus:ring-indigo-500 shadow-sm",
      secondary:
        "bg-gray-700 hover:bg-gray-600 disabled:hover:bg-gray-700 text-gray-100 border border-gray-600 focus:ring-gray-500",
      danger:
        "bg-red-600 hover:bg-red-700 disabled:hover:bg-red-600 text-white focus:ring-red-500 shadow-sm",
      success:
        "bg-green-600 hover:bg-green-700 disabled:hover:bg-green-600 text-white focus:ring-green-500 shadow-sm",
      ghost:
        "bg-transparent hover:bg-gray-700/50 disabled:hover:bg-transparent text-gray-300 hover:text-white disabled:hover:text-gray-300",
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
    active: "text-indigo-400 border-b-2 border-indigo-500",
    inactive: "text-gray-400 hover:text-gray-300",
  },

  // Card container
  card: {
    container:
      "bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden",
  },
};
